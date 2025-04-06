import { MongoClient } from 'mongodb';

// Connection URI from environment variables
const uri = process.env.MONGODB_URI || "mongodb+srv://kenmwendwamuthengi:ZBdrGYbUMwbTMMGY@cluster0.fkkscbr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Database Name
const dbName = 'portfolioDB';

// Create a new MongoClient
const client = new MongoClient(uri);

async function connectDB() {
    try {
        // Connect to MongoDB cluster
        await client.connect();
        console.log("Connected successfully to MongoDB");
        return client.db(dbName);
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        await client.close();
        process.exit(1);
    }
}

export default connectDB;
