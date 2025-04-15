"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 400, height: 600 });
// Function to collect metrics
function collectMetrics() {
    const metrics = {
        componentUsage: new Map(),
        tokenUsage: new Map(),
        inconsistencies: [],
        adoption: {
            total: 0,
            byTeam: new Map()
        }
    };
    // Traverse all pages
    figma.root.children.forEach((page) => {
        // Traverse all nodes in the page
        page.children.forEach(node => {
            traverseNodes(node, metrics);
        });
    });
    return metrics;
}
// Function to traverse nodes and collect data
function traverseNodes(node, metrics) {
    var _a;
    // Skip if the node is a PageNode
    if (node.type === 'PAGE') {
        return;
    }
    // Check if node is a component instance
    if (node.type === 'INSTANCE') {
        const componentName = ((_a = node.mainComponent) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown';
        metrics.componentUsage.set(componentName, (metrics.componentUsage.get(componentName) || 0) + 1);
    }
    // Check for style usage
    if ('fills' in node && Array.isArray(node.fills)) {
        node.fills.forEach((fill) => {
            if (fill.type === 'SOLID') {
                const color = `${fill.color.r},${fill.color.g},${fill.color.b}`;
                metrics.tokenUsage.set(color, (metrics.tokenUsage.get(color) || 0) + 1);
            }
        });
    }
    // Check for text styles
    if (node.type === 'TEXT' && typeof node.textStyleId === 'string') {
        const style = figma.getStyleById(node.textStyleId);
        if (style) {
            metrics.tokenUsage.set(style.name, (metrics.tokenUsage.get(style.name) || 0) + 1);
        }
    }
    // Check for inconsistencies
    checkInconsistencies(node, metrics);
    // Recursively check children
    if ('children' in node) {
        node.children.forEach(child => traverseNodes(child, metrics));
    }
}
// Function to check for design system inconsistencies
function checkInconsistencies(node, metrics) {
    // Example checks - can be expanded based on your design system rules
    if (node.type === 'TEXT') {
        if (!node.textStyleId) {
            metrics.inconsistencies.push({
                type: 'style',
                message: 'Text without style',
                nodeId: node.id,
                severity: 'medium'
            });
        }
    }
    if (node.type === 'FRAME') {
        if (!node.layoutMode) {
            metrics.inconsistencies.push({
                type: 'component',
                message: 'Frame without layout mode',
                nodeId: node.id,
                severity: 'low'
            });
        }
    }
}
// Helper function to convert Map to Object
function mapToObject(map) {
    const obj = {};
    map.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
}
// Handle messages from the UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'collect-metrics') {
        const metrics = collectMetrics();
        figma.ui.postMessage({
            type: 'metrics-data',
            data: {
                componentUsage: mapToObject(metrics.componentUsage),
                tokenUsage: mapToObject(metrics.tokenUsage),
                inconsistencies: metrics.inconsistencies,
                adoption: {
                    total: metrics.adoption.total,
                    byTeam: mapToObject(metrics.adoption.byTeam)
                }
            }
        });
    }
});
