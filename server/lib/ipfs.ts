import axios from 'axios';
import FormData from 'form-data';

export async function uploadFileToIPFS(file: Express.Multer.File): Promise<string | null> {
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('❌ Missing Pinata API keys');
    return null;
  }

  if (!file || !file.buffer) {
    console.error('❌ Invalid file buffer');
    return null;
  }

  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  const data = new FormData();

  // ✅ DIRECT BUFFER (IMPORTANT FIX)
  data.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  try {
    console.log("📤 Uploading to IPFS...");

    const response = await axios.post(url, data, {
      maxBodyLength: Infinity,
      headers: {
        ...data.getHeaders(),
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
    });

    console.log("✅ Pinata Response:", response.data);

    if (response.data?.IpfsHash) {
      return response.data.IpfsHash;
    }

    console.error("❌ No CID returned:", response.data);
    return null;

  } catch (err: any) {
    console.error("❌ Pinata ERROR FULL:");

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Headers:", err.response.headers);
      console.error("Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("Message:", err.message);
    }

    return null;
  }
}