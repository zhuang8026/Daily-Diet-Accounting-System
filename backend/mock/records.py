import json
import os

_json_path = os.path.join(os.path.dirname(__file__), 'demoRecords.json')

with open(_json_path, 'r', encoding='utf-8') as f:
    MOCK_RECORDS = json.load(f)
