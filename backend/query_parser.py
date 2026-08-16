import re

ALL_MACHINES = [
    'CNC-01', 'CNC-02', 'Press-01', 'Press-02', 
    'Weld-01', 'Weld-02', 'Assembly-01', 'Assembly-02', 
    'Paint-01', 'Paint-02'
]

ALL_SHIFTS = ['Morning', 'Afternoon', 'Night']

class QueryParser:
    @staticmethod
    def parse(query: str):
        query_lower = query.lower()
        
        # 1. Detect Machines
        detected_machines = []
        for m in ALL_MACHINES:
            if m.lower() in query_lower:
                detected_machines.append(m)
                
        if not detected_machines:
            # Check family names
            families = {
                'weld': ['Weld-01', 'Weld-02'], 
                'press': ['Press-01', 'Press-02'],
                'cnc': ['CNC-01', 'CNC-02'],
                'paint': ['Paint-01', 'Paint-02'],
                'assembly': ['Assembly-01', 'Assembly-02']
            }
            for f_key, f_machines in families.items():
                if f_key in query_lower:
                    detected_machines.extend(f_machines)

        detected_machines = list(dict.fromkeys(detected_machines))

        # 2. Detect Shifts
        detected_shifts = []
        for s in ALL_SHIFTS:
            if s.lower() in query_lower:
                detected_shifts.append(s)

        # 3. Detect Timeframe
        timeframe = 'this week'
        if 'today' in query_lower:
            timeframe = 'today'
        elif 'yesterday' in query_lower:
            timeframe = 'yesterday'
        elif 'last week' in query_lower:
            timeframe = 'last week'
        elif 'this week' in query_lower or 'week' in query_lower:
            timeframe = 'this week'
        elif 'month' in query_lower or '30 days' in query_lower:
            timeframe = 'last 30 days'
        elif 'all time' in query_lower or 'overall' in query_lower or 'historical' in query_lower:
            timeframe = 'all'

        # 4. Metadata Detection (Rows, Columns, Dataset stats)
        is_metadata = any(k in query_lower for k in [
            'row', 'rows', 'column', 'columns', 'ketli', 'ketla', 'kitne', 'kitni', 
            'schema', 'dataset', 'total record', 'record count', 'fields', 'field'
        ])

        # 4b. Raw row-level request detection (e.g. "first row", "row 1",
        # "show me raw data", "paheli entry", "give me an actual record")
        # This is DIFFERENT from is_metadata (which is about counting rows,
        # not seeing actual row content).
        wants_raw_rows = any(k in query_lower for k in [
            'first row', 'first entry', 'row 1', 'row1', 'sample row', 'sample data',
            'raw data', 'raw row', 'actual row', 'actual record', 'actual entry',
            'paheli entry', 'pehli entry', 'pehli row', 'show me a row', 'example row',
            'last row', 'last entry',
        ])

        # 5. Language Detection
        detected_lang = 'english'
        if any(w in query_lower for w in ['che', 'ketli', 'ketla', 'su', 'kem', 'bhai', 'cho', 'aavse', 'ma', 'aave', 'nathi', 'kai']):
            detected_lang = 'gujlish'
        elif any(w in query_lower for w in ['hai', 'hain', 'kitne', 'kitni', 'kya', 'kaun', 'kaunsi', 'par', 'mein', 'karo', 'batao', 'bataye']):
            detected_lang = 'hinglish'
        elif any(w in query_lower for w in ['पंक्तियाँ', 'स्तंभ', 'मशीन', 'उत्पादन', 'खराब']):
            detected_lang = 'hindi'
        elif any(w in query_lower for w in ['કેટલી', 'રો', 'કોલમ', 'મશીન']):
            detected_lang = 'gujarati'

        return {
            "query": query,
            "detected_machines": detected_machines,
            "detected_shifts": detected_shifts,
            "timeframe": timeframe,
            "is_metadata": is_metadata,
            "wants_raw_rows": wants_raw_rows,
            "language": detected_lang
        }