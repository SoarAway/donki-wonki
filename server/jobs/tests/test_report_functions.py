import os
import sys

# Add the server root to sys.path
# File is at: server/jobs/tests/test_report_functions.py
# Server root is 3 levels up
server_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

from jobs.report import send_report, get_top3_report

def test_send_report():
    print("Running test_send_report...")
    result = send_report("Kelana Jaya Line", "Kerinchi", "Delay", "test description00")
    return result

def test_get_top3_report_with_less_than_3_reports():
    print("Running test_get_top3_report_with_less_than_3_reports...")
    result = get_top3_report()
    return result

def test_send_3_reports():
    print("Running test_send_3_reports...")
    result_1 = send_report("Kelana Jaya Line", "USJ7", "Delay", "test description1")
    result_2 = send_report("Kelana Jaya Line", "Ara Damansara", "Delay", "test description2")
    result_3 = send_report("Kelana Jaya Line", "Abdullah Hukum", "Delay", "test description3")
    return result_1, result_2, result_3

def test_get_top3_report_with_more_than_3_reports():
    print("Running test_get_top3_report_with_more_than_3_reports...")
    result = get_top3_report()
    return result

if __name__ == '__main__':
    print(f"Test Send Report ID: {test_send_report()}")
    #print(f"Test Get Top 3 Reports With Less Than 3 Reports: {test_get_top3_report_with_less_than_3_reports()}")
    #print(f"Test Send 3 Reports IDs: {test_send_3_reports()}")
    print(f"Test Get Top 3 Reports With More Than 3 Reports: {test_get_top3_report_with_more_than_3_reports()}")