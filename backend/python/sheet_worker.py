import sys
import os
import json
import pandas as pd
import requests
import io

def is_google_sheets_url(url):
    return url.startswith('http') and 'docs.google.com/spreadsheets' in url

def get_csv_export_url(sheet_url):
    # Extract the sheet ID and construct the export URL
    try:
        sheet_id = sheet_url.split('/d/')[1].split('/')[0]
        return f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv'
    except Exception:
        return None

def read_google_sheet(sheet_url):
    csv_url = get_csv_export_url(sheet_url)
    if not csv_url:
        raise ValueError('Invalid Google Sheets URL')
    response = requests.get(csv_url)
    response.raise_for_status()
    df = pd.read_csv(io.StringIO(response.text))
    return df

def read_file(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    print(f"DEBUG: file_path={file_path}, ext={ext}", file=sys.stderr)
    if ext in ['.xlsx', '.xls']:
        df = pd.read_excel(file_path)
    elif ext == '.csv':
        df = pd.read_csv(file_path)
    else:
        raise ValueError('Unsupported file type')
    return df

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No input provided'}))
        sys.exit(1)
    input_arg = sys.argv[1]
    try:
        if is_google_sheets_url(input_arg):
            df = read_google_sheet(input_arg)
        else:
            df = read_file(input_arg)
        # Fill NaN with empty string for easier processing
        df = df.fillna('')
        # Find the Call Status column (case-insensitive)
        status_col = None
        for col in df.columns:
            if col.strip().lower() == 'call status':
                status_col = col
                break
        to_call = []
        if status_col:
            to_call = df[df[status_col].str.strip().str.lower() == 'not-called'].values.tolist()
        result = {
            'columns': list(df.columns),
            'rows': df.values.tolist(),
            'to_call': to_call
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main() 