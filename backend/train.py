import os
import numpy as np
import pandas as pd
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score

# Load data
TRAIN_PATH = "../data/customer_churn_dataset-training-master.csv"
TEST_PATH = "../data/customer_churn_dataset-testing-master.csv"
MODEL_PATH = "models/churn_pipeline.joblib"

train_df = pd.read_csv(TRAIN_PATH)
test_df = pd.read_csv(TEST_PATH)

# Clean target column
for df_name, df in [("train", train_df), ("test", test_df)]:
    df["Churn"] = df["Churn"].replace([np.inf, -np.inf], np.nan)
    missing_target = df["Churn"].isna().sum()
    if missing_target > 0:
        print(f"{df_name}: dropping {missing_target} rows with missing/invalid Churn values")
        df.dropna(subset=["Churn"], inplace=True)

# Convert target to int after cleaning
train_df["Churn"] = train_df["Churn"].astype(int)
test_df["Churn"] = test_df["Churn"].astype(int)

# Features and target
X_train = train_df.drop(columns=["Churn", "CustomerID"])
y_train = train_df["Churn"]

X_test = test_df.drop(columns=["Churn", "CustomerID"])
y_test = test_df["Churn"]

# Column groups
categorical_cols = ["Gender", "Subscription Type", "Contract Length"]
numerical_cols = [col for col in X_train.columns if col not in categorical_cols]

# Preprocessing
numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer(
    transformers=[
        ("num", numeric_transformer, numerical_cols),
        ("cat", categorical_transformer, categorical_cols)
    ]
)

# Model
model = LogisticRegression(max_iter=300)

# Full pipeline
pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("model", model)
])

# Train
pipeline.fit(X_train, y_train)

# Evaluate
y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]

print("Accuracy:", accuracy_score(y_test, y_pred))
print("ROC-AUC:", roc_auc_score(y_test, y_prob))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

# Save
os.makedirs("models", exist_ok=True)
joblib.dump(pipeline, MODEL_PATH)
print(f"Saved model to {MODEL_PATH}")