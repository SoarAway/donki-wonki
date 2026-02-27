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

async def predict_incident():
    # Paths to datasets
    x_posts_path = os.path.join(project_root, "services", "dataset", "x_latest_posts.json")
    xhs_data_path = os.path.join(project_root, "services", "dataset", "xhs_scraped_data_clean.csv")

    # Load X posts (JSON)
    with open(x_posts_path, 'r', encoding='utf-8') as f:
        x_posts = json.load(f)
    
    # Take latest 20 posts for context
    latest_x = x_posts[:20]
    x_context = "\n".join([f"- {p['timestamp']}: {p['text']}" for p in latest_x])

    # Load XHS data (CSV)
    xhs_df = pd.read_csv(xhs_data_path)
    # Take latest 10 rows for context
    latest_xhs = xhs_df.tail(10)
    xhs_context = "\n".join([f"- {row['scraped_at']}: {row['cleaned']}" for _, row in latest_xhs.iterrows()])

    combined_context = f"--- X POSTS ---\n{x_context}\n\n--- XIAOHONGSHU POSTS ---\n{xhs_context}"

    system_instruction = (
        "You are a highly reliable incident detection system acting as a senior railway dispatcher "
        "for the Kelana Jaya (KJ) LRT line in Malaysia.\n\n"

        "Your task is to analyze recent social media posts and identify whether there is an "
        "ACTIVE service disruption occurring TODAY only.\n\n"

        "Strict rules:\n"
        "1. Use ONLY information explicitly stated or strongly implied in the provided content.\n"
        "2. Ignore historical incidents, resolved issues, complaints without operational impact, "
        "or speculative posts.\n"
        "3. A disruption must affect train operations (e.g., delays, suspensions, power failure).\n"
        "4. Affected stations MUST be identified using official station names "
        "(e.g., 'KLCC', 'KL Sentral', 'Kelana Jaya', 'Masjid Jamek') or station codes (KJ1–KJ37).\n"
        "5. If no active incident TODAY can be confidently identified, set has_active_incident to false.\n\n"

        "Output requirements:\n"
        "- Respond ONLY with a single valid JSON object.\n"
        "- Do NOT include explanations, markdown, or extra text.\n"
        "- If information is missing, provide a reasonable estimate and lower the confidence score."
    )

    user_prompt = (
        f"Analyze the following social media content collected TODAY:\n\n"
        f"{combined_context}\n\n"

        "Your objective:\n"
        "- Determine whether there is a CURRENT and ONGOING service disruption on the Kelana Jaya LRT line.\n"
        "- If multiple incidents are mentioned, select the MOST RECENT unresolved one.\n\n"

        "Instructions:\n"
        "1. Only consider incidents that are still active or unresolved at the time of posting.\n"
        "2. Extract affected stations explicitly mentioned or clearly implied.\n"
        "3. Classify the incident into a concise incident_type.\n"
        "4. Summarize the situation clearly and briefly.\n"
        "5. If an end time is not stated, estimate based on typical LRT recovery durations.\n"
        "6. Assign a confidence_score reflecting certainty based on volume, clarity, and recency of posts.\n\n"

        "Return the result strictly in the JSON format defined."
    )

    output_schema = {
        "type": "object",
        "properties": {
            "has_active_incident": {
                "type": "boolean",
                "description": "True if an active service disruption is occurring today"
            },
            "affected_stations": {
                "type": "array",
                "items": {
                    "type": "string",
                    "description": "Official station name or KJ station code (KJ1–KJ37)"
                }
            },
            "incident_type": {
                "type": "string",
                "description": "Short classification such as Delay, Service Suspension, Technical Disruption, Power Failure"
            },
            "description": {
                "type": "string",
                "description": "Brief, factual summary of the incident"
            },
            "predicted_end_time": {
                "type": "string",
                "pattern": "^([01]\\d|2[0-3]):[0-5]\\d$",
                "description": "Estimated or stated end time in HH:MM (24-hour format)"
            }
        },
        "required": [
            "has_active_incident",
            "affected_stations",
            "incident_type",
            "description",
            "predicted_end_time"
        ]
    }

    client = get_gemini_client()
    try:
        prediction = await client.generate_structured(
            prompt=user_prompt,
            output_schema=output_schema,
            system_instruction=system_instruction
        )
        if prediction:
            # Add runned_at timestamp (UTC+8 for Malaysia)
            my_tz = timezone(timedelta(hours=8))
            prediction['runned_at'] = datetime.now(my_tz).isoformat()
        return prediction
    except Exception as e:
        import traceback
        print(f"Error predicting incident: {e}")
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = asyncio.run(predict_incident())
    if result:
        output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "predict_output.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=4)
        print(f"Prediction saved to {output_path}")
        print(json.dumps(result, indent=4))
