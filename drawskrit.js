"use strict";

var Drawing = {
    rectangle: function(ctx, centerPt, halfWidth, halfHeight, fillMode) {
        ctx.beginPath();
        ctx.rect(centerPt.x - halfWidth, centerPt.y - halfHeight, 2 * halfWidth, 2 * halfHeight);
        if (fillMode == "filled") ctx.fill();
        ctx.stroke();
    },

    square: function(ctx, centerPt, r, fillMode) {
        ctx.beginPath();
        ctx.rect(centerPt.x - r, centerPt.y - r, 2 * r, 2 * r);
        if (fillMode == "filled") ctx.fill();
        ctx.stroke();
    },

    ellipse: function(ctx, centerPt, halfWidth, halfHeight, fillMode) {
        ctx.beginPath();
        ctx.moveTo(centerPt.x - halfWidth, centerPt.y);
        ctx.bezierCurveTo(centerPt.x - halfWidth, centerPt.y - halfHeight, centerPt.x + halfWidth, centerPt.y - halfHeight, centerPt.x + halfWidth, centerPt.y);
        ctx.bezierCurveTo(centerPt.x + halfWidth, centerPt.y + halfHeight, centerPt.x - halfWidth, centerPt.y + halfHeight, centerPt.x - halfWidth, centerPt.y);
        if (fillMode == "filled") ctx.fill();
        ctx.stroke();
    },

    circle: function(ctx, centerPt, r, fillMode) {
        ctx.beginPath();
        ctx.arc(centerPt.x, centerPt.y, r, 2 * Math.PI, false);
        if (fillMode == "filled") ctx.fill();
        ctx.stroke();
    },

    triangle: function(ctx, centerPt, r, fillMode) {
        ctx.beginPath();
        ctx.moveTo(centerPt.x, centerPt.y - r);
        ctx.lineTo(centerPt.x + r, centerPt.y + r);
        ctx.lineTo(centerPt.x - r, centerPt.y + r);
        ctx.lineTo(centerPt.x, centerPt.y - r);
        if (fillMode == "filled") ctx.fill();
        ctx.stroke();
    },

    fillText: function(ctx, centerPt, text) {
        ctx.fillText(text, centerPt.x, centerPt.y);
    }
};

;(function() {
    var canvas = document.getElementById("drawing")
    var drawing = canvas.getContext('2d');

    function mapLength(obj) {
        var size = 0;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    }

    function clone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    var Default = {
        background: function() { return "white" },
        lineStyle: function() { return "solid" },
        fillMode: function() { return "empty" }
    };

    /*
    Parse multiple rows of text.
    */
    function parse(input)  {
        var rows = input.split(/\n/);

        var layers = new Array();
        var instructions = new Array();
        var metaInstructions = {
            background: { shape: "background", color: Default.background() },
            shapes: { shape: "shapes", lineStyle: Default.lineStyle(), fillMode: Default.fillMode() }
        };

        rows.forEach(function(row) {
            var trimmedRow = row.trim();

            if (trimmedRow.substr(0, 1) == '-') return; // ignore comments

            if (trimmedRow.substr(0, 1) == '=') {
                layers.push(instructions);
                instructions = new Array();
                return;
            }

            var rowInstructions = parseRow(trimmedRow);

            if (rowInstructions.metaInstructions) {
                for (var key in rowInstructions.metaInstructions) {
                    metaInstructions[key] = rowInstructions.metaInstructions[key];
                }
            }

            if (rowInstructions.drawingInstructions) {
                instructions.push({ drawingInstructions: rowInstructions.drawingInstructions, metaInstructions: clone(metaInstructions) });
            }
        });

        layers.push(instructions);

        return layers;
    }

    function newProperties() {
        return {
            color: null,
            textColor:  null,
            size: null,
            lineStyle: null,
            fillMode: null,
            heightModifier: null,
            cardinality: 1,
            texts: new Array()
        };
    }

    /*
    Parse a single row of text.
    Returns an array of meta instructions and an array of drawing instructions.
    */
    function parseRow(row) {
        var tokens = row.split(/\s+/);

        var metaInstructions = new Object();
        var drawingInstructions = new Array();
        var properties = newProperties();

        tokens.forEach(function(token) {
            switch (token) {
                case "background":
                    metaInstructions[token] = { color: properties.color, shape: token };
                    properties = newProperties();
                    return;

                case "shapes":
                    metaInstructions[token] = {
                        shape: token,
                        lineStyle: properties.lineStyle ? properties.lineStyle : Default.lineStyle(),
                        fillMode: properties.fillMode ? properties.fillMode : Default.fillMode() };
                    properties = newProperties();
                    return;

                case "blank":
                case "blanks":
                    for (var i = 0; i < properties.cardinality; i++) {
                        drawingInstructions.push({ shape: "blank" });
                    }
                    properties = newProperties();
                    return;

                case "square": case "rectangle": case "circle": case "ellipse": case "triangle":
                case "squares": case "rectangles": case "circles": case "ellipses": case "triangles":
                    for (var i = 0; i < properties.cardinality; i++) {
                        drawingInstructions.push({
                            text: properties.texts.length > i ? properties.texts[i] : null,
                            color: properties.color,
                            textColor: properties.textColor,
                            size: properties.size,
                            lineStyle: properties.lineStyle,
                            fillMode: properties.fillMode,
                            heightModifier: properties.heightModifier,
                            widthModifier: properties.widthModifier,
                            shape: token
                        });
                    };
                    properties = newProperties();
                    return;
            }

            switch (token) {
                case "aqua": case "black": case "blue": case "fuchsia": case "gray": case "green": case "lime":  case "maroon": case "navy":
                case "olive": case "orange": case "purple": case "red": case "silver": case "teal": case "white": case "yellow":
                    properties.color = token;
                    return;

                case "tiny": case "small": case "big":
                    properties.size = token;
                    return;

                case "dashed": case "dotted": case "solid":
                    properties.lineStyle = token;
                    return;

                case "filled": case "empty":
                    properties.fillMode = token;
                    return;

                case "full-height": case "half-height": case "quarter-height":
                    properties.heightModifier = token;
                    return;

                case "full-width": case "half-width": case "quarter-width":
                    properties.widthModifier = token;
                    return;
            }

            if (token.search(/^".*"$/) == 0 || token.search(/^'.*'$/) == 0) {
                properties.texts.push(token.substr(1, token.length - 2));
                if (properties.color != null) {
                    properties.textColor = properties.color;
                    properties.color = null;
                }
            }

            if (!isNaN(token)) {
                properties.cardinality = parseInt(token);
                return;
            }
        });

        return {
            metaInstructions : mapLength(metaInstructions) > 0 ? metaInstructions : null,
            drawingInstructions: drawingInstructions.length > 0 ? drawingInstructions : null
        };
    }

    function renderLayers(layers) {
        drawing.clearRect(0, 0, canvas.width, canvas.height);

        drawing.textAlign = "center";
        drawing.textBaseline = "middle";

        var firstLayer = true;
        layers.forEach(function(instructions) {
            render(instructions, firstLayer);
            firstLayer = false;
        });
    }

    /*
    Render multiple rows of instructions.
    Accepts an array of arrays of instructions.
    */
    function render(instructions, renderBackground) {
        var rowCount = instructions.length;

        var currentRow = 0;
        if (renderBackground) {
            instructions.forEach(function(rowInstructions) {
                renderRowBackground(rowInstructions, currentRow, rowCount);
                currentRow++;
            });
        }

        currentRow = 0;
        instructions.forEach(function(rowInstructions) {
            renderRow(rowInstructions, currentRow, rowCount);
            currentRow++;
        });
    }

    function renderRowBackground(rowInstructions, currentRow, rowCount) {
        var columnCount = rowInstructions.drawingInstructions.length;

        for (var key in rowInstructions.metaInstructions) {
            renderBackgroundInstruction(rowInstructions.metaInstructions[key], currentRow, 0, rowCount, columnCount);
        }
    }

    /*
    Render a single row of instructions.
    Accepts an array of instructions.
    */
    function renderRow(rowInstructions, currentRow, rowCount) {
        var columnCount = rowInstructions.drawingInstructions.length;

        for (var key in rowInstructions.metaInstructions) {
            renderInstruction(rowInstructions.metaInstructions[key], currentRow, 0, rowCount, columnCount);
        }

        var currentColumn = 0;
        rowInstructions.drawingInstructions.forEach(function(instruction) {
            renderInstruction(instruction, currentRow, currentColumn, rowCount, columnCount);
            currentColumn++;
        });
    }

    function sizeModifierValue(heightModifier) {
        switch (heightModifier) {
            case "full-height": case "full-width": return 1;
            case "half-height": case "half-width": return 2;
            case "quarter-height": case "quarter-width": return 4;
        }
    }

    /*
    Calculate the center of a shape (e.g. for circles)
    */
    function calcCenter(currentRow, currentColumn, rowCount, columnCount, heightModifier, widthModifier) {
        var cellWidth = canvas.width / columnCount;
        var cellHeight = canvas.height / rowCount;

        var x = function() {
            switch (widthModifier) {
                case "full-width": case "half-width": case "quarter-width":
                    return currentColumn * cellWidth + cellWidth * (columnCount / 2 / sizeModifierValue(widthModifier));
                default:
                    return currentColumn * cellWidth + cellWidth / 2;
            }
        }();

        var y = function() {
            switch (heightModifier) {
                case "full-height": case "half-height": case "quarter-height":
                    return currentRow * cellHeight + cellHeight * (rowCount / 2 / sizeModifierValue(heightModifier));
                default:
                    return currentRow * cellHeight + cellHeight / 2;
            }
        }();

        return {
            x: x,
            y: y
        };
    }

    /*
    Calculate a shapes radius including specified size
    */
    function calcRadius(rowCount, columnCount, size) {
        var factor = 0.75;

        switch (size) {
            case "big":
                factor = 0.95;
                break;

            case "small":
                factor = 0.5;
                break;

            case "tiny":
                factor = 0.25;
                break;
        }

        return Math.min(canvas.width / columnCount / 2, canvas.height / rowCount / 2) * factor;
    }

    function calcHalfWidth(columnCount, size, widthModifier) {
        var factor = 0.8;

        switch (size) {
            case "big":
                factor = 0.95;
                break;

            case "small":
                factor = 0.55;
                break;

            case "tiny":
                factor = 0.3;
                break;
        }

        switch (widthModifier) {
            case "full-width": case "half-width": case "quarter-width":
                return canvas.width / sizeModifierValue(widthModifier) / 2 * factor;

            default:
                return canvas.width / columnCount / 2 * factor;
        }
    }

    function calcHalfHeight(rowCount, size, heightModifier) {
        var factor = 0.7;

        switch (size) {
            case "big":
                factor = 0.95;
                break;

            case "small":
                factor = 0.45;
                break;

            case "tiny":
                factor = 0.2;
                break;
        }

        switch (heightModifier) {
            case "full-height": case "half-height": case "quarter-height":
                return canvas.height / sizeModifierValue(heightModifier) / 2 * factor;

            default:
                return canvas.height / rowCount / 2 * factor;
        }
    }

    function calcFontSize(rowCount, columnCount, size, heightModifier) {
        var factor = 0.75;

        switch (size) {
            case "big":
                factor = 1.0;
                break;

            case "small":
                factor = 0.5;
                break;

            case "tiny":
                factor = 0.25;
                break;
        }

        var yDiv = heightModifier ? 2 : rowCount;

        return Math.min(canvas.width / columnCount / 8, canvas.height / yDiv / 8) * factor;
    }

    function setLineStyle(lineStyle) {
        switch (lineStyle) {
            case "dashed":
                drawing.setLineDash([6]);
                break;
            case "dotted":
                drawing.setLineDash([2, 2]);
                break;
            case "solid":
                drawing.setLineDash([]);
                break;
        }
    }

    function renderBackgroundInstruction(instruction, currentRow, currentColumn, rowCount, columnCount) {
        switch (instruction.shape) {
            case "background":
                drawing.fillStyle = instruction.color;
                drawing.fillRect(0, canvas.height * currentRow / rowCount, canvas.width, canvas.height / rowCount);
                break;
        }
    }

    /*
    Render a single instruction.
    */
    function renderInstruction(instruction, currentRow, currentColumn, rowCount, columnCount) {
        if (instruction.shape == "shapes") {
            canvas.lineStyle = instruction.lineStyle;
            canvas.fillMode = instruction.fillMode;
            return;
        }

        drawing.fillStyle = drawing.strokeStyle = (instruction.color != null ? instruction.color : "black");
        setLineStyle(instruction.lineStyle ? instruction.lineStyle : canvas.lineStyle);

        switch (instruction.shape) {
            case "square":
            case "squares":
                Drawing.square(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount, instruction.heightModifier, instruction.widthModifier),
                    calcRadius(rowCount, columnCount, instruction.size), instruction.fillMode ? instruction.fillMode : canvas.fillMode);
                break;

            case "rectangle":
            case "rectangles":
                Drawing.rectangle(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount, instruction.heightModifier, instruction.widthModifier),
                    calcHalfWidth(columnCount, instruction.size, instruction.widthModifier), calcHalfHeight(rowCount, instruction.size, instruction.heightModifier),
                    instruction.fillMode ? instruction.fillMode : canvas.fillMode);
                break;

            case "circle":
            case "circles":
                Drawing.circle(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount, instruction.heightModifier, instruction.widthModifier),
                    calcRadius(rowCount, columnCount, instruction.size), instruction.fillMode ? instruction.fillMode : canvas.fillMode);
                break;

            case "ellipse":
            case "ellipses":
                Drawing.ellipse(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount, instruction.heightModifier, instruction.widthModifier),
                    calcHalfWidth(columnCount, instruction.size, instruction.widthModifier), calcHalfHeight(rowCount, instruction.size, instruction.heightModifier),
                    instruction.fillMode ? instruction.fillMode : canvas.fillMode);
                break;

            case "triangle":
            case "triangles":
                Drawing.triangle(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount, instruction.heightModifier, instruction.widthModifier),
                    calcRadius(rowCount, columnCount, instruction.size), instruction.fillMode ? instruction.fillMode : canvas.fillMode);
                break;
        }

        if (instruction.text) {
            drawing.fillStyle = instruction.textColor ? instruction.textColor : "black";
            drawing.font = calcFontSize(rowCount, columnCount, instruction.size, instruction.heightModifier) + "pt Arial";
            Drawing.fillText(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount, instruction.heightModifier, instruction.widthModifier), instruction.text);
        }
    }

    window.onload = function() {
        var input = document.getElementById("input");

        var draw = function() {
            var layers = parse(input.value);
            renderLayers(layers);

            window.requestAnimationFrame(draw);
        };

        window.requestAnimationFrame(draw);
    };
})();