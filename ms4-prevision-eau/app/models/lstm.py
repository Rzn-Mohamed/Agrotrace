from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List, Tuple

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset

logger = logging.getLogger(__name__)


class SlidingWindowDataset(Dataset):
    """Dataset PyTorch pour séries temporelles univariées."""

    def __init__(self, series: np.ndarray, seq_len: int):
        self.series = series.astype(np.float32)
        self.seq_len = seq_len

    def __len__(self) -> int:
        return len(self.series) - self.seq_len

    def __getitem__(self, index: int) -> Tuple[torch.Tensor, torch.Tensor]:
        x = self.series[index : index + self.seq_len]
        y = self.series[index + self.seq_len]
        return (
            torch.tensor(x, dtype=torch.float32).unsqueeze(-1),
            torch.tensor(y, dtype=torch.float32),
        )


class HydricStressLSTM(nn.Module):
    """Petit modèle LSTM pour une régression continue."""

    def __init__(
        self,
        input_size: int,
        hidden_size: int = 64,
        num_layers: int = 2,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.regressor = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        output, _ = self.lstm(x)
        last_state = output[:, -1, :]
        return self.regressor(last_state).squeeze(-1)


@dataclass
class LSTMConfig:
    seq_len: int
    epochs: int
    learning_rate: float
    batch_size: int = 32


class LSTMForecaster:
    """Pipeline complet d'entraînement + inférence LSTM."""

    def __init__(self, config: LSTMConfig):
        self.config = config

    def fit_and_forecast(
        self,
        series: np.ndarray,
        horizon_steps: int,
    ) -> List[float]:
        if len(series) <= self.config.seq_len + 1:
            raise ValueError("Série insuffisante pour entraîner le LSTM.")

        dataset = SlidingWindowDataset(series, self.config.seq_len)
        loader = DataLoader(dataset, batch_size=self.config.batch_size, shuffle=True, drop_last=False)

        model = HydricStressLSTM(input_size=1, hidden_size=64, num_layers=2, dropout=0.1)
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=self.config.learning_rate)

        model.train()
        for epoch in range(self.config.epochs):
            losses = []
            for batch_x, batch_y in loader:
                optimizer.zero_grad()
                preds = model(batch_x)
                loss = criterion(preds, batch_y)
                loss.backward()
                optimizer.step()
                losses.append(loss.item())
            logger.debug(
                "PrévisionEau :: epoch %s/%s - loss=%.4f",
                epoch + 1,
                self.config.epochs,
                np.mean(losses),
            )

        model.eval()
        preds: List[float] = []
        last_sequence = torch.tensor(series[-self.config.seq_len :], dtype=torch.float32).view(
            1, self.config.seq_len, 1
        )

        with torch.no_grad():
            for _ in range(horizon_steps):
                pred = model(last_sequence).item()
                preds.append(pred)

                new_row = torch.tensor([[[pred]]], dtype=torch.float32)
                last_sequence = torch.cat([last_sequence[:, 1:, :], new_row], dim=1)

        return preds

