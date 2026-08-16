import unittest
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app import app

class TestFactoryCopilotAPI(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_health(self):
        res = self.app.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'online')
        self.assertEqual(data['dataset_rows'], 1350)

    def test_dashboard_data(self):
        res = self.app.get('/api/dashboard-data?timeframe=this+week')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('kpi_overview', data)
        self.assertIn('machine_summaries', data)
        self.assertIn('shift_comparison', data)

    def test_chat_worst_downtime(self):
        res = self.app.post('/api/chat', json={"message": "Which machine has the worst downtime this week?"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("worst", data['answer'].lower())

    def test_chat_scrap_weld02(self):
        res = self.app.post('/api/chat', json={"message": "What is causing most scrap on Weld-02?"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("Weld-02", data['answer'])

    def test_chat_shift_comparison(self):
        res = self.app.post('/api/chat', json={"message": "Compare night shift vs morning shift performance"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("morning", data['answer'].lower())

    def test_kpi_insight(self):
        res = self.app.post('/api/kpi-insight', json={"timeframe": "this week"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(len(data['report']) > 50)
        self.assertTrue("oee" in data['report'].lower() or "report" in data['report'].lower() or "plant" in data['report'].lower())

    def test_sandbox_valid_aggregation(self):
        from backend.sandbox_service import SecureProcessSandbox
        csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "factory_data.csv")
        sandbox = SecureProcessSandbox(csv_path)
        
        # Test valid pandas calculation
        code = "result = df.groupby('shift')['oee_percent'].mean().round(2).to_dict()"
        res = sandbox.run(code, timeout_sec=2.0)
        self.assertTrue(res['success'])
        self.assertIn("Morning", res['output'])

    def test_sandbox_security_blocks(self):
        from backend.sandbox_service import SecureProcessSandbox
        csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "factory_data.csv")
        sandbox = SecureProcessSandbox(csv_path)

        # 1. Banned Import
        res1 = sandbox.run("import os; os.listdir('.')")
        self.assertFalse(res1['success'])
        self.assertIn("Security Block", res1['error'])

        # 2. Dunder attribute traversal
        res2 = sandbox.run("x = ().__class__.__bases__")
        self.assertFalse(res2['success'])
        self.assertIn("Security Block", res2['error'])

        # 3. Double underscore string injection
        res3 = sandbox.run("getattr((), '__class__')")
        self.assertFalse(res3['success'])
        self.assertIn("Security Block", res3['error'])

        # 4. Exponentiation attack (10**1000)
        res4 = sandbox.run("x = 10 ** 1000")
        self.assertFalse(res4['success'])
        self.assertIn("Security Block", res4['error'])

        # 5. Sequence multiplier attack
        res5 = sandbox.run("x = [0] * 100000")
        self.assertFalse(res5['success'])
        self.assertIn("Security Block", res5['error'])

    def test_sandbox_loop_block_and_timeout(self):
        from backend.sandbox_service import SecureProcessSandbox
        csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "factory_data.csv")
        sandbox = SecureProcessSandbox(csv_path)

        # While loop is blocked by AST validator
        res = sandbox.run("while True: pass")
        self.assertFalse(res['success'])
        self.assertIn("Security Block", res['error'])

if __name__ == '__main__':
    unittest.main()
