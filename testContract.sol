// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { ContractRegistry } from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import { IWeb2Json } from "@flarenetwork/flare-periphery-contracts/coston2/IWeb2Json.sol";

// On-chain record of a verified route optimization result
struct RouteRecord {
    uint256 totalCostScaled; // total_cost * 1e18
    uint256 numNodes;
    uint256 numWaypoints;
}

// Mirrors the JSON response from /optimum_ef_route_onchain
struct DataTransportObject {
    uint256 total_cost_scaled;
    uint256 num_nodes;
    uint256 num_waypoints;
}

interface IRouteOptimizerVerifier {
    function addRoute(IWeb2Json.Proof calldata data) external;
    function getAllRoutes() external view returns (RouteRecord[] memory);
}

contract RouteOptimizerVerifier {
    mapping(uint256 => RouteRecord) public results;
    uint256[] public routeIds;
    uint256 private nextId = 1;

    event RouteAdded(
        uint256 indexed id,
        uint256 totalCostScaled,
        uint256 numNodes,
        uint256 numWaypoints
    );

    function addRoute(IWeb2Json.Proof calldata data) public {
        require(isWeb2JsonProofValid(data), "Invalid proof");

        DataTransportObject memory dto = abi.decode(
            data.data.responseBody.abiEncodedData,
            (DataTransportObject)
        );

        uint256 id = nextId++;
        RouteRecord memory record = RouteRecord({
            totalCostScaled: dto.total_cost_scaled,
            numNodes: dto.num_nodes,
            numWaypoints: dto.num_waypoints
        });

        results[id] = record;
        routeIds.push(id);

        emit RouteAdded(id, dto.total_cost_scaled, dto.num_nodes, dto.num_waypoints);
    }

    function getAllRoutes() public view returns (RouteRecord[] memory) {
        RouteRecord[] memory allRoutes = new RouteRecord[](routeIds.length);
        for (uint256 i = 0; i < routeIds.length; i++) {
            allRoutes[i] = results[routeIds[i]];
        }
        return allRoutes;
    }

    function getRouteCount() public view returns (uint256) {
        return routeIds.length;
    }

    // Required for typechain to pick up the DTO type
    function abiSignatureHack(DataTransportObject calldata dto) public pure {}

    function isWeb2JsonProofValid(
        IWeb2Json.Proof calldata _proof
    ) private view returns (bool) {
        return ContractRegistry.getFdcVerification().verifyWeb2Json(_proof);
    }
}