import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function getModelSchema() {
    try {
        console.log("Fetching model details for bytedance/seedream-4.5...");
        // Retrieve the model details which should contain the latest version and its schema
        const model = await replicate.models.get('bytedance', 'seedream-4.5');

        if (model.latest_version) {
            console.log("Latest Version ID:", model.latest_version.id);
            console.log("Input Schema:", JSON.stringify((model.latest_version.openapi_schema as any)?.components?.schemas?.Input, null, 2));
        } else {
            console.log("No latest version found in model details.");
            console.log("Full Model Data:", JSON.stringify(model, null, 2));
        }

    } catch (error) {
        console.error("Error fetching model schema:", error);
    }
}

getModelSchema();
