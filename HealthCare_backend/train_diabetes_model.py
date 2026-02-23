"""
Train a Random Forest classifier on the Pima Indians Diabetes Dataset.
Saves the trained model to models/diabetes_model.joblib.

Run once:  python train_diabetes_model.py
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import accuracy_score, classification_report
import joblib

# ── Load Data ─────────────────────────────────────────────────────────────────

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "diabetes.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "diabetes_model.joblib")

print("Loading dataset…")
df = pd.read_csv(DATA_PATH)

FEATURES = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age",
]
TARGET = "Outcome"

X = df[FEATURES].values
y = df[TARGET].values

# ── Handle Zero Values ────────────────────────────────────────────────────────
# In the Pima dataset, 0 in Glucose/BP/Skin/Insulin/BMI means missing.
# Replace 0 with column median for those columns.

cols_with_zeros = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
for col in cols_with_zeros:
    idx = FEATURES.index(col)
    col_data = X[:, idx]
    median_val = np.median(col_data[col_data != 0])
    col_data[col_data == 0] = median_val

# ── Train/Test Split ──────────────────────────────────────────────────────────

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Train: {len(X_train)} | Test: {len(X_test)}")

# ── Hyperparameter Tuning ─────────────────────────────────────────────────────

param_grid = {
    "n_estimators": [100, 200, 300],
    "max_depth": [5, 8, 12, None],
    "min_samples_split": [2, 5, 10],
    "min_samples_leaf": [1, 2, 4],
}

print("Running GridSearchCV (this may take a minute)…")
grid = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring="accuracy",
    n_jobs=-1,
    verbose=0,
)
grid.fit(X_train, y_train)

best_model = grid.best_estimator_
print(f"\nBest params: {grid.best_params_}")
print(f"Best CV accuracy: {grid.best_score_:.4f}")

# ── Evaluate on Test Set ──────────────────────────────────────────────────────

y_pred = best_model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\nTest accuracy: {acc:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["No Diabetes", "Diabetes"]))

# ── Feature Importances ──────────────────────────────────────────────────────

importances = best_model.feature_importances_
print("Feature importances:")
for name, imp in sorted(zip(FEATURES, importances), key=lambda x: -x[1]):
    print(f"  {name:30s} {imp:.4f}")

# ── Save Model ────────────────────────────────────────────────────────────────

os.makedirs(MODEL_DIR, exist_ok=True)

# Save model + feature names together
artifact = {
    "model": best_model,
    "features": FEATURES,
    "accuracy": acc,
}
joblib.dump(artifact, MODEL_PATH)
print(f"\n✅ Model saved to {MODEL_PATH}")
print(f"   Accuracy: {acc:.2%}")
