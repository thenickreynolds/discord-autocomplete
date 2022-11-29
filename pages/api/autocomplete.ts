import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const key = process.env.MAPS_API_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { q } = req.query;
  const queryString = (q as string).trim();
  if (!queryString || queryString.length === 0) {
    res.status(500).json({ error: "Invalid query" });
    return;
  }

  const mapsUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(queryString)}&key=${key}`;

  await axios.get(mapsUrl, {
    headers: {
        'Accept-Encoding': 'application/json',
    }
}).then(r => r.data).then(data => {
    const responseData = data.predictions ? data.predictions.map((item) => ({ place_id: item.place_id, ...item.structured_formatting })) : data;
    res.status(200).json(responseData);
  }).catch(e=> {
    res.status(500).json({ error: e.toString() })
  });
}
