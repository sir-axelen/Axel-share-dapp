import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt || pinataJwt === "masukkan_jwt_pinata_kamu_di_sini") {
      return NextResponse.json(
        { error: "Pinata JWT is not configured in .env.local" },
        { status: 500 }
      );
    }

    // Pinata expects a FormData object with the file
    const pinataFormData = new FormData();
    pinataFormData.append("file", file);

    // Optional: Add metadata
    const metadata = JSON.stringify({
      name: file.name,
    });
    pinataFormData.append("pinataMetadata", metadata);

    // Optional: Add options (e.g., cidVersion: 1)
    const options = JSON.stringify({
      cidVersion: 1,
    });
    pinataFormData.append("pinataOptions", options);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: pinataFormData as any,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Pinata upload failed:", errorText);
      return NextResponse.json(
        { error: "Failed to upload to IPFS" },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // data.IpfsHash is the CID
    return NextResponse.json({
      success: true,
      ipfsHash: data.IpfsHash,
      pinSize: data.PinSize,
      timestamp: data.Timestamp
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
