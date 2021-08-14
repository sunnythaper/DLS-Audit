// #################################################################################################
// #  HEADERS
// #################################################################################################
function getHeader(content, id = "") {
    if (id) {
        return `<p class="header body3" id="${id}">${content}</p>`;
    }
    else {
        return `<p class="header body3">${content}</p>`;
    }
}
// #################################################################################################
// #  GET TYPE
// #################################################################################################
function getType(node) {
    return `${getHeader("Type")}<p>${node.type}</p>`;
}
// #################################################################################################
// #  GET LAYERS
// #################################################################################################
function getLayers(node, indent = 0) {
    let layers = "";
    if (indent == 0) {
        layers += getHeader("Layers", "header-layers");
    }
    layers += getLayer(node, indent);
    if ("children" in node) {
        if (node.type !== "INSTANCE") {
            for (const child of node.children) {
                layers += getLayers(child, indent + 1);
            }
        }
    }
    return layers;
}
function getLayer(node, indent) {
    var layer = '<p class="layer legal1">';
    layer += getLayerIndent(indent, true);
    layer += getLayerIcon(node);
    layer += node.name + "</p>";
    layer += getInspection(node, indent);
    return layer;
}
function getLayerIndent(indent, extraSpace = false) {
    var indents = "";
    for (var i = indent; i >= 1; i--) {
        if (extraSpace) {
            indents += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        }
        else {
            indents += "&nbsp;";
        }
    }
    return indents;
}
function getLayerIcon(node) {
    var type = "";
    var icon = "";
    switch (node.type) {
        case 'COMPONENT':
            icon = "https://i.imgur.com/mMomyWA.png";
            break;
        case 'COMPONENT_SET':
            icon = "https://i.imgur.com/mMomyWA.png";
            break;
        case 'FRAME':
            if (node.layoutMode == "HORIZONTAL") {
                icon = "https://i.imgur.com/agzGebN.png";
            }
            else if (node.layoutMode == "VERTICAL") {
                icon = "https://i.imgur.com/nIXSMck.png";
            }
            else {
                icon = "https://i.imgur.com/xd32fdS.png";
            }
            break;
        case 'GROUP':
            icon = "https://i.imgur.com/xd32fdS.png";
            break;
        case 'BOOLEAN_OPERATION':
            icon = "https://i.imgur.com/xd32fdS.png";
            break;
        case 'INSTANCE':
            icon = "https://i.imgur.com/axmNW7f.png";
            break;
        case 'TEXT':
            icon = "https://i.imgur.com/xjaHdfH.png";
            break;
        default:
            icon = "";
            break;
    }
    return `<img src="${icon}" height="12px" width="12px" />${getLayerIndent(4)}`;
}
// #################################################################################################
// #  GET INSPECTION
// #################################################################################################
function getInspection(node, indent) {
    var inspection = "";
    inspection += checkAutolayout(node, indent);
    inspection += checkColorStyle(node, indent);
    inspection += checkDefaultName(node, indent);
    inspection += checkFillContainer(node, indent);
    inspection += checkMainComponent(node, indent);
    inspection += checkTextStyle(node, indent);
    return inspection;
}
function getReport(content, indent) {
    return `<div class="layer report legal1">${getLayerIndent(indent + 1, true)}&nbsp;${content}</div>`;
}
function checkAutolayout(node, indent) {
    var report = "";
    if (node.type == "FRAME" || node.type == "GROUP" || node.type == "COMPONENT" || node.type == "COMPONENT_SET") {
        if (node.layoutMode == "NONE" || node.type == "GROUP") {
            report += getReport("Verify if this layer should have auto layout enabled", indent);
        }
    }
    return report;
}
function checkColorStyle(node, indent) {
    var report = "";
    if (node.type != "Document" && node.type != "Page" && node.type != "Slice") {
        if (!node.fillStyleId && node.fills[0]) {
            report += getReport("Layer is missing a fill color style", indent);
        }
        if (!node.strokeStyleId && node.strokes[0]) {
            report += getReport("Layer is missing a stroke color style", indent);
        }
    }
    return report;
}
function checkDefaultName(node, indent) {
    var report = "";
    const defaultNames = RegExp(/^(Union|Substract|Intersect|Exclude|(Page|Frame|Group|Slice|Rectangle|Line|Ellipse|Polygon|Star|Vector|Text|Component|Property)(\sCopy)?(\s\d+)?)(=.*)?$/);
    if (defaultNames.test(node.name)) {
        report += getReport("Layer name cannot be a default value. Please choose a unique name", indent);
    }
    return report;
}
function checkFillContainer(node, indent) {
    var report = "";
    if (node.type == "INSTANCE" && (node.layoutAlign == "INHERIT" && node.layoutGrow == 0)) {
        // TODO: Ignore for components such as Text Button and Checkbox and Icon
        report += getReport("Verify if this layer should fill container. ", indent);
    }
    else if ((node.type == "TEXT" || node.type == "FRAME" || node.type == "GROUP") && (node.layoutAlign == "INHERIT" && node.layoutGrow == 0)) {
        report += getReport("Verify if this layer should fill container.", indent);
    }
    return report;
}
function checkMainComponent(node, indent) {
    var report = "";
    if (node.type == "INSTANCE" && node.mainComponent.parent == null) {
        report += getReport("Verify if the main component for this instance still exists", indent);
    }
    return report;
}
function checkTextStyle(node, indent) {
    var report = "";
    if (node.type == "TEXT") {
        if (node.autoRename == true) {
            report += getReport("Layer is set to autorename. Make sure you specify a name.", indent);
        }
        if (!node.textStyleId) {
            report += getReport("Layer is missing a text style", indent);
        }
    }
    return report;
}
// #################################################################################################
// #  MAIN APP
// #################################################################################################
function App() {
    const selection = figma.currentPage.selection[0];
    var message = "";
    message += getType(selection);
    message += getLayers(selection);
    return message;
}
// #################################################################################################
// #  FIGMA UI
// #################################################################################################
figma.showUI(__html__, {
    width: 600,
    height: 1000
});
figma.ui.postMessage(App());
figma.ui.onmessage = (message) => {
    if (message.rescan) {
        figma.ui.postMessage(App());
    }
};
