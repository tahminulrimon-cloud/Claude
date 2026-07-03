#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

python3 init_db.py
streamlit run app.py --server.address 0.0.0.0 --server.port 8501
