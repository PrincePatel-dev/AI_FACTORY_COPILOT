import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pandas as pd
from backend.sandbox_service import SecureProcessSandbox

def main():
    print("=================================================================")
    print(" [PROOF OF ACCURACY & SANDBOX ISOLATION VERIFICATION]")
    print("=================================================================")
    
    # 1. Calculate ground truth directly using Pandas
    df = pd.read_csv("factory_data.csv")
    gt_weld02_oee = df[df['machine_id'] == 'Weld-02']['oee_percent'].mean()
    gt_press01_night_scrap = df[(df['machine_id'] == 'Press-01') & (df['shift'] == 'Night')]['scrap_units'].sum()
    gt_pearson = df['downtime_min'].corr(df['scrap_units'])

    print(f"\n>> GROUND TRUTH (Direct Pandas Calculation):")
    print(f"  1. Weld-02 Mean OEE: {gt_weld02_oee:.4f}%")
    print(f"  2. Press-01 Night Shift Total Scrap: {gt_press01_night_scrap} units")
    print(f"  3. Downtime vs Scrap Pearson Correlation: {gt_pearson:.4f}")

    # 2. Execute through Sandbox
    sandbox = SecureProcessSandbox("factory_data.csv")
    
    print(f"\n>> SANDBOX EXECUTION (Isolated Child Process):")
    res1 = sandbox.run("result = df[df['machine_id'] == 'Weld-02']['oee_percent'].mean()")
    res2 = sandbox.run("result = df[(df['machine_id'] == 'Press-01') & (df['shift'] == 'Night')]['scrap_units'].sum()")
    res3 = sandbox.run("result = df['downtime_min'].corr(df['scrap_units'])")

    print("\n>> ACCURACY COMPARISON:")
    print(f"  Sandbox Output 1: {res1['output']} (Matches Ground Truth: {float(res1['output']) == round(gt_weld02_oee, 4)})")
    print(f"  Sandbox Output 2: {res2['output']} (Matches Ground Truth: {int(res2['output']) == gt_press01_night_scrap})")
    print(f"  Sandbox Output 3: {res3['output']} (Matches Ground Truth: {float(res3['output']) == round(gt_pearson, 4)})")

    print(f"\n>> PROCESS ISOLATION PROOF:")
    print(f"  Main Process PID: {os.getpid()}")
    print(f"  Sandbox Child PID: {res1['sandbox_meta']['child_pid']} (Different PID = Separate OS Process)")
    print(f"  Sandbox Execution Time: {res1['sandbox_meta']['execution_ms']} ms")

if __name__ == '__main__':
    main()
