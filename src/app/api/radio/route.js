import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://de1.api.radio-browser.info/json/stations/bycountry/Kazakhstan?limit=50"
    );

    if (!res.ok) {
      throw new Error("Failed to fetch radio stations");
    }

    const data = await res.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Radio API error", details: err.message },
      { status: 500 }
    );
  }
}
