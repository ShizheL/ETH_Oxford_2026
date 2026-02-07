import { artifacts, run, web3 } from "hardhat";
import { RouteOptimizerVerifierInstance } from "../../typechain-types";
import {
    prepareAttestationRequestBase,
    submitAttestationRequest,
    retrieveDataAndProofBaseWithRetry,
} from "../utils/fdc";

const RouteOptimizerVerifier = artifacts.require("RouteOptimizerVerifier");

const { WEB2JSON_VERIFIER_URL_TESTNET, VERIFIER_API_KEY_TESTNET, COSTON2_DA_LAYER_URL } = process.env;

// yarn hardhat run scripts/fdcExample/testContract.ts --network coston2

// Request data — uses the new onchain-friendly endpoint
const apiUrl = "https://testfastapi-production-325b.up.railway.app/optimum_ef_route_onchain";

// Simple JQ filter: field extraction only, no math — this is what FDC supports
const postProcessJq = `{total_cost_scaled: .total_cost_scaled, num_nodes: .num_nodes, num_waypoints: .num_waypoints}`;

const httpMethod = "POST";
// Defaults to "Content-Type": "application/json"
const headers = "{}";
const queryParams = "{}";
const body = JSON.stringify({
    "grid_density": 6,
    "start_long": -122.4194,
    "start_lat": 37.7749,
    "end_long": -122.4089,
    "end_lat": 37.7849,
    "start_time": "2026-02-07T12:00:00.000Z",
    "duration_hours": 2,
    "fuel_cost_per_km": 0.15,
    "lambda_value": 0.5
});

// ABI signature — flat uint256 fields matching the API response
const abiSignature = `{"components": [{"internalType": "uint256", "name": "total_cost_scaled", "type": "uint256"},{"internalType": "uint256", "name": "num_nodes", "type": "uint256"},{"internalType": "uint256", "name": "num_waypoints", "type": "uint256"}],"name": "task","type": "tuple"}`;

// Configuration constants
const attestationTypeBase = "Web2Json";
const sourceIdBase = "PublicWeb2";
const verifierUrlBase = WEB2JSON_VERIFIER_URL_TESTNET;

async function prepareAttestationRequest(apiUrl: string, postProcessJq: string, abiSignature: string) {
    const requestBody = {
        url: apiUrl,
        httpMethod: httpMethod,
        headers: headers,
        queryParams: queryParams,
        body: body,
        postProcessJq: postProcessJq,
        abiSignature: abiSignature,
    };

    const url = `${verifierUrlBase}/Web2Json/prepareRequest`;
    const apiKey = VERIFIER_API_KEY_TESTNET;

    return await prepareAttestationRequestBase(url, apiKey, attestationTypeBase, sourceIdBase, requestBody);
}

async function retrieveDataAndProof(abiEncodedRequest: string, roundId: number) {
    const url = `${COSTON2_DA_LAYER_URL}/api/v1/fdc/proof-by-request-round-raw`;
    console.log("Url:", url, "\n");
    return await retrieveDataAndProofBaseWithRetry(url, abiEncodedRequest, roundId);
}

async function deployAndVerifyContract() {
    const args: any[] = [];
    const routeVerifier: RouteOptimizerVerifierInstance = await RouteOptimizerVerifier.new(...args);

    try {
        await run("verify:verify", {
            address: routeVerifier.address,
            constructorArguments: args,
        });
    } catch (e: any) {
        console.log(e);
    }

    console.log("RouteOptimizerVerifier deployed to", routeVerifier.address, "\n");
    return routeVerifier;
}

async function interactWithContract(routeVerifier: RouteOptimizerVerifierInstance, proof: any) {
    console.log("Proof hex:", proof.response_hex, "\n");

    // Decode the response type from the artifact ABI
    const IWeb2JsonVerification = await artifacts.require("IWeb2JsonVerification");
    const responseType = IWeb2JsonVerification._json.abi[0].inputs[0].components[1];
    console.log("Response type:", responseType, "\n");

    const decodedResponse = web3.eth.abi.decodeParameter(responseType, proof.response_hex);
    console.log("Decoded proof:", decodedResponse, "\n");

    const transaction = await routeVerifier.addRoute({
        merkleProof: proof.proof,
        data: decodedResponse,
    });

    console.log("Transaction:", transaction.tx, "\n");
    console.log("Verified route results:\n", await routeVerifier.getAllRoutes(), "\n");
}

async function main() {
    const data = await prepareAttestationRequest(apiUrl, postProcessJq, abiSignature);
    console.log("Data:", data, "\n");

    const abiEncodedRequest = data.abiEncodedRequest;
    const roundId = await submitAttestationRequest(abiEncodedRequest);
    const proof = await retrieveDataAndProof(abiEncodedRequest, roundId);

    const routeVerifier: RouteOptimizerVerifierInstance = await deployAndVerifyContract();
    await interactWithContract(routeVerifier, proof);
}

void main().then(() => {
    process.exit(0);
});