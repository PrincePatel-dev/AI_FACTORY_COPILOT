import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class FactoryDataService:
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.df = None
        self._load_data()

    def _load_data(self):
        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(f"Data file not found at {self.csv_path}")
        self.df = pd.read_csv(self.csv_path)
        self.df['date'] = pd.to_datetime(self.df['date'])
        self.max_date = self.df['date'].max()
        self.min_date = self.df['date'].min()

    def get_sample_rows(self, n=5, machines=None, shifts=None, from_start=True):
        """Returns actual raw row records (not aggregated) - for queries like
        'what is the first row', 'show me row 1', 'give me raw data'."""
        sub_df = self.df.copy()

        if machines:
            machines_upper = [m.upper() for m in machines]
            sub_df = sub_df[sub_df['machine_id'].str.upper().isin(machines_upper)]
        if shifts:
            shifts_title = [s.capitalize() for s in shifts]
            sub_df = sub_df[sub_df['shift'].str.capitalize().isin(shifts_title)]

        # Sort chronologically so "first row" means the earliest real record,
        # matching what a person would see opening the CSV file.
        sub_df = sub_df.sort_values('date')

        sample = sub_df.head(n) if from_start else sub_df.tail(n)
        sample = sample.copy()
        sample['date'] = sample['date'].dt.strftime('%Y-%m-%d')
        return sample.to_dict(orient='records')

    def get_dataset_metadata(self):
        """Returns structural metadata about the CSV dataset (rows, columns, machines, operators)."""
        columns = list(self.df.columns)
        machines = list(self.df['machine_id'].unique())
        operators = list(self.df['operator'].unique())
        shifts = list(self.df['shift'].unique())
        
        return {
            "total_rows": len(self.df),
            "total_columns": len(columns),
            "columns": columns,
            "date_range": f"{self.min_date.strftime('%Y-%m-%d')} to {self.max_date.strftime('%Y-%m-%d')}",
            "total_machines": len(machines),
            "machines": machines,
            "shifts": shifts,
            "operators": operators
        }

    def parse_timeframe(self, timeframe_str: str):
        """
        Parses timeframe strings like 'today', 'yesterday', 'this week', 'last week', 'last 30 days', 'all'
        Relative to max_date in dataset.
        """
        if not timeframe_str or timeframe_str == 'all':
            return self.min_date, self.max_date
            
        tf = timeframe_str.lower()
        max_d = self.max_date
        
        if 'today' in tf:
            return max_d, max_d
        elif 'yesterday' in tf:
            return max_d - timedelta(days=1), max_d - timedelta(days=1)
        elif 'this week' in tf or 'week' in tf:
            return max_d - timedelta(days=7), max_d
        elif 'last week' in tf:
            return max_d - timedelta(days=14), max_d - timedelta(days=7)
        elif 'month' in tf or '30' in tf:
            return max_d - timedelta(days=30), max_d
        else:
            return max_d - timedelta(days=7), max_d

    def filter_data(self, machines=None, shifts=None, start_date=None, end_date=None):
        filtered = self.df.copy()
        
        if start_date and end_date:
            filtered = filtered[(filtered['date'] >= pd.to_datetime(start_date)) & (filtered['date'] <= pd.to_datetime(end_date))]
            
        if machines:
            # normalize machine names
            machines_upper = [m.upper() for m in machines]
            # check exact or substring
            filtered = filtered[filtered['machine_id'].str.upper().isin(machines_upper) | 
                                filtered['machine_id'].str.upper().apply(lambda x: any(m in x for m in machines_upper))]
                                
        if shifts:
            shifts_title = [s.capitalize() for s in shifts]
            filtered = filtered[filtered['shift'].str.capitalize().isin(shifts_title)]
            
        return filtered

    def get_kpi_overview(self, timeframe='this week'):
        start_d, end_d = self.parse_timeframe(timeframe)
        sub_df = self.filter_data(start_date=start_d, end_date=end_d)
        
        if sub_df.empty:
            sub_df = self.df

        avg_oee = round(sub_df['oee_percent'].mean(), 1)
        total_downtime = int(sub_df['downtime_min'].sum())
        total_scrap = int(sub_df['scrap_units'].sum())
        total_produced = int(sub_df['units_produced'].sum())
        
        # Worst machine by downtime
        machine_downtime = sub_df.groupby('machine_id')['downtime_min'].sum().sort_values(ascending=False)
        worst_downtime_machine = machine_downtime.index[0] if not machine_downtime.empty else "N/A"
        worst_downtime_val = int(machine_downtime.iloc[0]) if not machine_downtime.empty else 0
        
        # Worst machine by scrap
        machine_scrap = sub_df.groupby('machine_id')['scrap_units'].sum().sort_values(ascending=False)
        worst_scrap_machine = machine_scrap.index[0] if not machine_scrap.empty else "N/A"
        worst_scrap_val = int(machine_scrap.iloc[0]) if not machine_scrap.empty else 0

        # Top downtime reason overall
        dt_reasons = sub_df[sub_df['downtime_reason'] != 'No Downtime'].groupby('downtime_reason')['downtime_min'].sum().sort_values(ascending=False)
        top_dt_reason = dt_reasons.index[0] if not dt_reasons.empty else "None"

        return {
            "timeframe": timeframe,
            "start_date": start_d.strftime('%Y-%m-%d'),
            "end_date": end_d.strftime('%Y-%m-%d'),
            "avg_oee_percent": avg_oee,
            "total_downtime_min": total_downtime,
            "total_downtime_hours": round(total_downtime / 60, 1),
            "total_scrap_units": total_scrap,
            "total_produced_units": total_produced,
            "worst_downtime_machine": worst_downtime_machine,
            "worst_downtime_min": worst_downtime_val,
            "worst_scrap_machine": worst_scrap_machine,
            "worst_scrap_units": worst_scrap_val,
            "top_downtime_reason": top_dt_reason
        }

    def get_aggregated_summary(self, machines=None, shifts=None, timeframe='this week'):
        start_d, end_d = self.parse_timeframe(timeframe)
        sub_df = self.filter_data(machines=machines, shifts=shifts, start_date=start_d, end_date=end_d)
        
        if sub_df.empty:
            sub_df = self.filter_data(machines=machines, shifts=shifts)
            
        summary_by_machine = sub_df.groupby('machine_id').agg(
            avg_oee=('oee_percent', lambda x: round(x.mean(), 1)),
            total_downtime_min=('downtime_min', 'sum'),
            total_scrap_units=('scrap_units', 'sum'),
            total_units_produced=('units_produced', 'sum'),
            total_planned_units=('units_planned', 'sum')
        ).reset_index()

        # Get top downtime reason per machine
        top_dt_per_machine = {}
        for m, group in sub_df.groupby('machine_id'):
            non_zero = group[group['downtime_reason'] != 'No Downtime']
            if not non_zero.empty:
                top_r = non_zero.groupby('downtime_reason')['downtime_min'].sum().idxmax()
                top_dt_per_machine[m] = top_r
            else:
                top_dt_per_machine[m] = 'None'

        # Get top scrap reason per machine
        top_scrap_per_machine = {}
        for m, group in sub_df.groupby('machine_id'):
            if group['scrap_units'].sum() > 0:
                top_sr = group.groupby('scrap_reason')['scrap_units'].sum().idxmax()
                top_scrap_per_machine[m] = top_sr
            else:
                top_scrap_per_machine[m] = 'None'

        summary_by_machine['top_downtime_reason'] = summary_by_machine['machine_id'].map(top_dt_per_machine)
        summary_by_machine['top_scrap_reason'] = summary_by_machine['machine_id'].map(top_scrap_per_machine)
        
        summary_by_machine = summary_by_machine.sort_values(by='total_downtime_min', ascending=False)
        return summary_by_machine.to_dict(orient='records')

    def get_shift_comparison(self, timeframe='this week'):
        start_d, end_d = self.parse_timeframe(timeframe)
        sub_df = self.filter_data(start_date=start_d, end_date=end_d)
        
        shift_summary = sub_df.groupby('shift').agg(
            avg_oee=('oee_percent', lambda x: round(x.mean(), 1)),
            total_downtime_min=('downtime_min', 'sum'),
            avg_downtime_min=('downtime_min', lambda x: round(x.mean(), 1)),
            total_scrap_units=('scrap_units', 'sum'),
            avg_scrap_units=('scrap_units', lambda x: round(x.mean(), 1)),
            total_produced=('units_produced', 'sum')
        ).reset_index()

        # Shift order
        shift_order = {'Morning': 1, 'Afternoon': 2, 'Night': 3}
        shift_summary['order'] = shift_summary['shift'].map(shift_order)
        shift_summary = shift_summary.sort_values('order').drop(columns=['order'])
        
        # Shift downtime reason breakdown
        reasons_by_shift = {}
        for s, group in sub_df.groupby('shift'):
            non_zero = group[group['downtime_reason'] != 'No Downtime']
            top_reasons = non_zero.groupby('downtime_reason')['downtime_min'].sum().sort_values(ascending=False).head(2).to_dict()
            reasons_by_shift[s] = top_reasons

        result = shift_summary.to_dict(orient='records')
        for item in result:
            item['top_downtime_reasons'] = reasons_by_shift.get(item['shift'], {})
            
        return result

    def get_machine_deep_dive(self, machine_id: str, timeframe='this week'):
        start_d, end_d = self.parse_timeframe(timeframe)
        sub_df = self.filter_data(machines=[machine_id], start_date=start_d, end_date=end_d)
        
        if sub_df.empty:
            sub_df = self.filter_data(machines=[machine_id])

        total_dt = int(sub_df['downtime_min'].sum())
        total_scrap = int(sub_df['scrap_units'].sum())
        avg_oee = round(sub_df['oee_percent'].mean(), 1)

        dt_breakdown = sub_df[sub_df['downtime_reason'] != 'No Downtime'].groupby('downtime_reason')['downtime_min'].sum().sort_values(ascending=False).to_dict()
        scrap_breakdown = sub_df.groupby('scrap_reason')['scrap_units'].sum().sort_values(ascending=False).to_dict()
        shift_breakdown = sub_df.groupby('shift').agg(
            oee=('oee_percent', lambda x: round(x.mean(), 1)),
            downtime=('downtime_min', 'sum'),
            scrap=('scrap_units', 'sum')
        ).to_dict(orient='index')

        return {
            "machine_id": machine_id,
            "records_analyzed": len(sub_df),
            "avg_oee_percent": avg_oee,
            "total_downtime_min": total_dt,
            "total_scrap_units": total_scrap,
            "downtime_reasons_min": dt_breakdown,
            "scrap_reasons_units": scrap_breakdown,
            "shift_performance": shift_breakdown
        }

    def get_trend_series(self, timeframe='this week'):
        start_d, end_d = self.parse_timeframe(timeframe)
        sub_df = self.filter_data(start_date=start_d, end_date=end_d)
        
        daily = sub_df.groupby(sub_df['date'].dt.strftime('%Y-%m-%d')).agg(
            avg_oee=('oee_percent', lambda x: round(x.mean(), 1)),
            total_downtime=('downtime_min', 'sum'),
            total_scrap=('scrap_units', 'sum')
        ).reset_index()
        
        return daily.to_dict(orient='records')