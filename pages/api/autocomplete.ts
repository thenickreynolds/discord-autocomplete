import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const key = process.env.MAPS_API_KEY;

function allowCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Credentials', "true")
  res.setHeader('Access-Control-Allow-Origin', '*')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
}

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
    allowCors(res);
    res.status(200).json(responseData);
  }).catch(e=> {
    res.status(500).json({ error: e.toString() })
  });
}
