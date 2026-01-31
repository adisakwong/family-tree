// js/tree.js - D3.js Visualization Logic

let svg, g, zoom;
const margin = { top: 20, right: 90, bottom: 30, left: 90 };
const width = 1200 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

function initTree() {
    d3.select("#tree-container").selectAll("*").remove();

    svg = d3.select("#tree-container").append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(zoom = d3.zoom().on("zoom", (event) => {
            g.attr("transform", event.transform);
        }))
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    g = svg.append("g");
}

function renderTree(members) {
    if (!members || members.length === 0) return;
    initTree();

    // Convert flat data to hierarchy
    const stratify = d3.stratify()
        .id(d => d.id)
        .parentId(d => d.parentId);

    const root = stratify(members);
    const treeLayout = d3.tree().size([height, width]);
    treeLayout(root);

    // Define clip paths in defs
    const defs = g.append("defs");

    // Links
    g.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    // Nodes
    const nodes = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", d => "node" + (d.data.id ? " node-id-" + d.data.id.replace(/[^a-zA-Z0-9]/g, '_') : ""))
        .attr("transform", d => `translate(${d.y},${d.x})`);

    // Create clip paths for each node
    nodes.each(function(d, i) {
        d.safeId = 'node_' + i;
        defs.append("clipPath")
            .attr("id", "clip-" + d.safeId)
            .append("circle")
            .attr("r", 28);
    });

    // Background circle (white)
    nodes.append("circle")
        .attr("r", 30)
        .style("fill", "#fff")
        .style("stroke", "steelblue")
        .style("stroke-width", "3px");

    // Use foreignObject for images (better CORS handling)
    nodes.append("foreignObject")
        .attr("x", -28)
        .attr("y", -28)
        .attr("width", 56)
        .attr("height", 56)
        .append("xhtml:div")
        .style("width", "56px")
        .style("height", "56px")
        .style("border-radius", "50%")
        .style("overflow", "hidden")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("background-color", "#e0e0e0")
        .each(function(d) {
            const div = d3.select(this);
            const photoUrl = d.data.photoUrl;
            
            if (photoUrl && photoUrl.trim() !== '') {
                div.append("img")
                    .attr("src", photoUrl)
                    .style("width", "100%")
                    .style("height", "100%")
                    .style("object-fit", "cover")
                    .on("error", function() {
                        // On error, show initials
                        d3.select(this).remove();
                        div.style("background-color", "#4CAF50")
                           .style("color", "#fff")
                           .style("font-size", "20px")
                           .style("font-weight", "bold")
                           .text(d.data.name.charAt(0).toUpperCase());
                    });
            } else {
                // Show initials if no photo
                div.style("background-color", "#4CAF50")
                   .style("color", "#fff")
                   .style("font-size", "20px")
                   .style("font-weight", "bold")
                   .text(d.data.name.charAt(0).toUpperCase());
            }
        });

    // Labels
    nodes.append("text")
        .attr("dy", 45)
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .text(d => d.data.name)
        .style("font-weight", "bold")
        .style("font-size", "11px")
        .style("fill", "#333");

    // Add edit/delete icons below name
    const controlGroups = nodes.append("foreignObject")
        .attr("x", -30)
        .attr("y", 55)
        .attr("width", 60)
        .attr("height", 20)
        .append("xhtml:div")
        .style("display", "flex")
        .style("gap", "8px")
        .style("justify-content", "center")
        .style("align-items", "center")
        .each(function(d) {
            const div = d3.select(this);
            
            // Edit text button
            div.append("button")
                .style("background-color", "#2196F3")
                .style("color", "white")
                .style("border", "none")
                .style("border-radius", "6px")
                .style("padding", "3px 8px")
                .style("cursor", "pointer")
                .style("font-size", "11px")
                .style("font-weight", "600")
                .style("margin", "0 3px")
                .style("box-shadow", "0 2px 4px rgba(33, 150, 243, 0.3)")
                .text("Edit")
                .attr("title", "Edit Member")
                .on("click", function(event) {
                    event.stopPropagation();
                    window.editMemberNode(d.data.id);
                });
            
            // Delete text button
            div.append("button")
                .style("background-color", "#f44336")
                .style("color", "white")
                .style("border", "none")
                .style("border-radius", "6px")
                .style("padding", "3px 8px")
                .style("cursor", "pointer")
                .style("font-size", "11px")
                .style("font-weight", "600")
                .style("margin", "0 3px")
                .style("box-shadow", "0 2px 4px rgba(244, 67, 54, 0.3)")
                .text("Del")
                .attr("title", "Delete Member")
                .on("click", function(event) {
                    event.stopPropagation();
                    window.deleteMemberNode(d.data.id);
                });
        });
    
    // Set initial visibility based on state
    if (window.state && !window.state.showEditControls) {
        controlGroups.style("display", "none");
    }
}

function zoomToNode(nodeId) {
    const safeNodeId = nodeId.replace(/[^a-zA-Z0-9]/g, '_');
    const node = g.select(`.node-id-${safeNodeId}`);
    if (node.empty()) return;

    clearHighlight();
    node.select("circle").classed("highlight", true);

    const d = node.datum();
    const scale = 1.5;
    const x = d.y;
    const y = d.x;

    const container = document.getElementById('tree-container');
    const w = container.clientWidth;
    const h = container.clientHeight;

    d3.select("#tree-container svg")
        .transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity
            .translate(w / 2, h / 2)
            .scale(scale)
            .translate(-x, -y)
        );
}

function clearHighlight() {
    g.selectAll("circle").classed("highlight", false);
}
