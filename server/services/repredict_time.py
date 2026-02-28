import json
import os
import sys
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.append(project_root)

from core.gemini import get_gemini_client
import pandas as pd

async def repredict_time(prev_stations: List[str], prev_end_time: str) -> Dict[str, Any] | None:
    # Paths to datasets
    x_posts_path = os.path.join(project_root, "services", "dataset", "x_latest_posts.json")
    xhs_data_path = os.path.join(project_root, "services", "dataset", "xhs_scraped_data_clean.csv")

    # Load X posts (JSON)
    with open(x_posts_path, 'r', encoding='utf-8') as f:
        x_posts = json.load(f)
    
    # Take latest 10 posts for updating context
    latest_x = x_posts[:10]
    x_context = "\n".join([f"- {p['timestamp']}: {p['text']}" for p in latest_x])

    # Load XHS data (CSV)
    xhs_df = pd.read_csv(xhs_data_path)
    latest_xhs = xhs_df.tail(5)
    xhs_context = "\n".join([f"- {row['scraped_at']}: {row['cleaned']}" for _, row in latest_xhs.iterrows()])

    combined_context = f"--- LATEST X POSTS ---\n{x_context}\n\n--- LATEST XIAOHONGSHU POSTS ---\n{xhs_context}"

    system_instruction = (
        "You are an incident manager tracking an ongoing railway disruption on the Kelana Jaya (KJ) LRT line. "
        "Your goal is to decide if a previously predicted recovery time is still accurate based on the latest social media chatter. "
        "Respond ONLY with a valid JSON object."
    )

    user_prompt = (
        f"Analyze the LATEST SOCIAL MEDIA UPDATES to refine a PREVIOUS DISRUPTION PREDICTION.\n\n"
        f"PREVIOUS PREDICTION:\n"
        f"- Affected Stations: {', '.join(prev_stations)}\n"
        f"- Predicted End Time: {prev_end_time}\n\n"
        f"LATEST SOCIAL MEDIA UPDATES:\n{combined_context}\n\n"
        "Your objective:\n"
        "1. Determine if the incident is STILL ACTIVE.\n"
        "2. If active, update the 'affected_stations' and 'predicted_end_time' based on the latest info.\n"
        "3. If resolved, set 'has_active_incident' to false and 'predicted_end_time' to the actual resolution time.\n"
        "4. Provide a descriptive 'incident_type' and a brief 'description' summarizing the change (if any).\n\n"
        "Return the result strictly in the JSON format defined."
    )

    output_schema = {
        "type": "object",
        "properties": {
            "has_active_incident": {
                "type": "boolean",
                "description": "True if the service disruption is still ongoing"
            },
            "incident_type": {
                "type": "string",
                "description": "Concise classification (e.g., Extended Delay, Partial Recovery, Resolved)"
            },
            "description": {
                "type": "string",
                "description": "Summary of current status and why the prediction was updated or maintained"
            },
            "predicted_end_time": {
                "type": "string",
                "pattern": "^([01]\\d|2[0-3]):[0-5]\\d$",
                "description": "Refined estimated end time in HH:MM (24-hour format)"
            }
        },
        "required": [
            "has_active_incident",
            "incident_type",
            "description",
            "predicted_end_time"
        ]
    }

    client = get_gemini_client()
    try:
        prediction: Dict[str, Any] | None = await client.generate_structured(
            prompt=user_prompt,
            output_schema=output_schema,
            system_instruction=system_instruction
        )
        if prediction:
            # Stick with the station that was predicted earlier
            prediction['affected_stations'] = prev_stations
            # Add runned_at timestamp (UTC+8 for Malaysia)
            my_tz = timezone(timedelta(hours=8))
            prediction['runned_at'] = datetime.now(my_tz).isoformat()
        return prediction
    except Exception as e:
        print(f"Error repredicting time: {e}")
        return None

if __name__ == "__main__":
    # Load sample logic from predict_output.json if available
    predict_output_path = os.path.join(project_root, "services", "predict_output.json")
    
    sample_stations = ["KLCC", "Masjid Jamek"]
    sample_end_time = "12:00"

    if os.path.exists(predict_output_path):
        try:
            with open(predict_output_path, "r", encoding="utf-8") as f:
                prev_data = json.load(f)
                sample_stations = prev_data.get("affected_stations", sample_stations)
                sample_end_time = prev_data.get("predicted_end_time", sample_end_time)
                print(f"Loaded sample stations and end time from {predict_output_path}")
        except Exception as e:
            print(f"Failed to load sample data from {predict_output_path}: {e}")
    
    print(f"Testing reprediction for {sample_stations} with initial end time {sample_end_time}...")
    result = asyncio.run(repredict_time(sample_stations, sample_end_time))
    if result:
        output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "repredict_output.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=4)
        print(f"Reprediction saved to {output_path}")
        print(json.dumps(result, indent=4))
