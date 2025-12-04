"""
Service d'IA pour générer des recommandations d'irrigation enrichies.
Utilise Google Gemini ou OpenAI GPT pour analyser les données agronomiques.
"""
import json
import os
from typing import Dict, Optional
import httpx
from datetime import datetime


class AIService:
    """
    Service asynchrone pour interagir avec les LLMs (Gemini Flash, GPT-4o, etc.)
    et générer des analyses qualitatives d'irrigation.
    """
    
    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        """
        Initialise le service IA.
        
        Args:
            api_key: Clé API pour le LLM
            model: Nom du modèle (ex: "gemini-1.5-flash", "gpt-4o")
        """
        self.api_key = api_key
        self.model = model
        self.timeout = 30.0  # Timeout de 30 secondes
        
        # Configuration selon le modèle
        if "gemini" in model.lower():
            self.provider = "gemini"
            # Pour Gemini API, mapper les noms de modèles aux identifiants corrects
            # Gemini 1.5 Flash et Pro utilisent des identifiants simples
            if "1.5-flash" in model.lower() or model == "gemini-1.5-flash":
                model_name = "gemini-1.5-flash"
            elif "1.5-pro" in model.lower() or model == "gemini-1.5-pro":
                model_name = "gemini-1.5-pro"
            elif "pro" in model.lower():
                model_name = "gemini-pro"
            else:
                model_name = model
            self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        elif "gpt" in model.lower():
            self.provider = "openai"
            self.api_url = "https://api.openai.com/v1/chat/completions"
        else:
            raise ValueError(f"Modèle non supporté: {model}")
    
    def _build_prompt(self, context_data: dict, scientific_result: dict) -> str:
        """
        Construit le prompt pour le LLM.
        
        Args:
            context_data: Données contextuelles (météo, culture, règles)
            scientific_result: Résultats du calcul scientifique
        
        Returns:
            Le prompt formaté
        """
        prompt = f"""Tu es un agronome expert spécialisé en irrigation de précision.

TÂCHE: Analyser les données météorologiques et agronomiques ci-dessous, ainsi que le résultat du calcul mathématique, pour valider ou ajuster la recommandation d'irrigation.

DONNÉES CONTEXTUELLES:
- Type de culture: {context_data.get('culture_type', 'N/A')}
- Stade de culture: {context_data.get('stade_culture', 'N/A')}
- Zone ID: {context_data.get('zone_id', 'N/A')}

DONNÉES MÉTÉOROLOGIQUES:
- Évapotranspiration (ET0): {context_data.get('et0', 'N/A')} mm/jour
- Température maximale demain: {context_data.get('temp_max', 'N/A')}°C
- Probabilité de pluie: {context_data.get('probabilite_pluie', 'N/A')}%
- Index de stress hydrique: {context_data.get('stress_index', 'N/A')} (0=Humide, 1=Sec)

RÈGLES AGRONOMIQUES:
- Priorité: {context_data.get('priorite', 'N/A')}
- Contrainte hydrique: {context_data.get('contrainte_hydrique', 'N/A')}

RÉSULTAT DU CALCUL SCIENTIFIQUE:
- Volume d'eau recommandé: {scientific_result.get('volume_eau_m3', 'N/A')} m³
- Durée d'irrigation: {scientific_result.get('duree_minutes', 'N/A')} minutes
- Horaire de début: {scientific_result.get('horaire_debut', 'N/A')}
- Instruction: {scientific_result.get('instruction', 'N/A')}

FORMAT DE SORTIE REQUIS (JSON STRICT):
{{
  "analyse_contextuelle": "Analyse détaillée du contexte météorologique et de son impact sur l'irrigation (2-3 phrases)",
  "justification_agronomique": "Justification scientifique de la recommandation en tenant compte du stade de culture et des conditions (2-3 phrases)",
  "conseils_additionnels": ["Conseil pratique 1", "Conseil pratique 2", "Conseil pratique 3"],
  "score_confiance": 85
}}

INSTRUCTIONS:
1. Fournis une analyse contextuelle qui explique les conditions météo et leur impact
2. Justifie la recommandation d'un point de vue agronomique
3. Propose 2-4 conseils pratiques additionnels (vérification équipement, fertilisation, surveillance, etc.)
4. Attribue un score de confiance entre 0 et 100 basé sur la cohérence des données et la certitude de ton analyse
5. Réponds UNIQUEMENT avec le JSON, sans texte additionnel avant ou après

Génère maintenant ton analyse:"""
        
        return prompt
    
    def _create_fallback_response(self, scientific_result: dict) -> dict:
        """
        Crée une réponse de secours en cas d'échec du LLM.
        
        Args:
            scientific_result: Résultats du calcul scientifique
            
        Returns:
            Réponse de fallback
        """
        return {
            "analyse_contextuelle": "Analyse IA temporairement indisponible. Recommandation basée uniquement sur le calcul scientifique.",
            "justification_agronomique": f"Calcul basé sur l'évapotranspiration ET0 et le coefficient cultural (Kc). Volume calculé: {scientific_result.get('volume_eau_m3', 0)} m³.",
            "conseils_additionnels": [
                "Vérifier l'état des systèmes d'irrigation avant utilisation",
                "Surveiller l'humidité du sol après irrigation",
                "Consulter les prévisions météo actualisées"
            ],
            "score_confiance": 50,
            "genere_par": f"{self.model} (mode fallback)"
        }
    
    async def generate_irrigation_advice(
        self, 
        context_data: dict, 
        scientific_result: dict
    ) -> dict:
        """
        Génère une analyse qualitative d'irrigation via un LLM.
        
        Args:
            context_data: Données contextuelles (météo, culture, règles)
            scientific_result: Résultats du calcul scientifique
            
        Returns:
            Dict contenant l'analyse IA avec les champs:
            - analyse_contextuelle
            - justification_agronomique
            - conseils_additionnels
            - score_confiance
            - genere_par
        """
        # Construction du prompt
        prompt = self._build_prompt(context_data, scientific_result)
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                if self.provider == "gemini":
                    # Appel API Gemini
                    headers = {"Content-Type": "application/json"}
                    payload = {
                        "contents": [{
                            "parts": [{
                                "text": prompt
                            }]
                        }],
                        "generationConfig": {
                            "temperature": 0.3,  # Basse température pour cohérence
                            "topK": 40,
                            "topP": 0.95,
                            "maxOutputTokens": 4096,  # Augmenté pour réponses complètes
                        }
                    }
                    
                    response = await client.post(
                        f"{self.api_url}?key={self.api_key}",
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        # Extraction du texte généré
                        try:
                            print(f"DEBUG - Gemini response: {json.dumps(result, indent=2)}")
                            generated_text = result["candidates"][0]["content"]["parts"][0]["text"]
                            # Nettoyage du JSON (enlever markdown si présent)
                            if "```json" in generated_text:
                                generated_text = generated_text.split("```json")[1].split("```")[0].strip()
                            elif "```" in generated_text:
                                generated_text = generated_text.split("```")[1].split("```")[0].strip()
                            
                            # Parse du JSON
                            ai_response = json.loads(generated_text)
                            ai_response["genere_par"] = self.model
                            return ai_response
                        except (KeyError, IndexError, json.JSONDecodeError) as e:
                            print(f"Erreur parsing réponse Gemini: {e}")
                            print(f"Response structure: {json.dumps(result, indent=2)}")
                            return self._create_fallback_response(scientific_result)
                    else:
                        print(f"Erreur API Gemini: {response.status_code} - {response.text}")
                        return self._create_fallback_response(scientific_result)
                
                elif self.provider == "openai":
                    # Appel API OpenAI
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.api_key}"
                    }
                    payload = {
                        "model": self.model,
                        "messages": [
                            {
                                "role": "system",
                                "content": "Tu es un agronome expert. Tu réponds uniquement en JSON strict."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "temperature": 0.3,
                        "max_tokens": 1024,
                        "response_format": {"type": "json_object"}
                    }
                    
                    response = await client.post(
                        self.api_url,
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        try:
                            generated_text = result["choices"][0]["message"]["content"]
                            ai_response = json.loads(generated_text)
                            ai_response["genere_par"] = self.model
                            return ai_response
                        except (KeyError, IndexError, json.JSONDecodeError) as e:
                            print(f"Erreur parsing réponse OpenAI: {e}")
                            return self._create_fallback_response(scientific_result)
                    else:
                        print(f"Erreur API OpenAI: {response.status_code} - {response.text}")
                        return self._create_fallback_response(scientific_result)
        
        except httpx.TimeoutException:
            print(f"Timeout lors de l'appel au LLM ({self.timeout}s)")
            return self._create_fallback_response(scientific_result)
        except Exception as e:
            print(f"Erreur inattendue: {e}")
            return self._create_fallback_response(scientific_result)


# Instance singleton (sera initialisée dans le router)
_ai_service_instance: Optional[AIService] = None


def get_ai_service(api_key: str, model: str) -> AIService:
    """
    Factory pour obtenir une instance du service IA.
    
    Args:
        api_key: Clé API pour le LLM
        model: Nom du modèle
        
    Returns:
        Instance de AIService
    """
    global _ai_service_instance
    
    # Recréer l'instance si les paramètres changent
    if _ai_service_instance is None or _ai_service_instance.model != model:
        _ai_service_instance = AIService(api_key=api_key, model=model)
    
    return _ai_service_instance
