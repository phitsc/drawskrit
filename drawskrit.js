
Drawing = {
    fillRectangle: function(ctx, rect) {
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    },

    fillSquare: function(ctx, centerPt, r) {
        ctx.fillRect(centerPt.x - r, centerPt.y - r, 2 * r, 2 * r);
    },

    fillCircle: function(ctx, centerPt, r) {
        ctx.beginPath();
        ctx.arc(centerPt.x, centerPt.y, r, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();
    }
};

;(function() {
    var canvas = document.getElementById("drawing")
    var drawing = canvas.getContext('2d');

    /*
    Parse multiple rows of text.
    Returns an array of arrays of instructions.
    */
    function parse(input)  {
        var rows = input.split(/\n/);

        var instructions = new Array();

        rows.forEach(function(row) {
            var perRowInstructions = parseRow(row);

            if (perRowInstructions) {
                instructions.push(perRowInstructions);
            }
        });

        if (instructions.length > 0) {
            console.log(instructions);
        }

        return instructions;
    }

    /*
    Parse a single row of text.
    Returns an array of instructions.
    */
    function parseRow(row) {
        var tokens = row.split(/\s+/);

        var instructions = new Array();

        var label = null;
        var amount = null;
        var color = null;
        var size = null; 

        tokens.forEach(function(token) {
            switch (token) {
                case "square": case "rectangle": case "circle":
                    instructions.push({ label: label, amount: amount, color: color, size: size, shape: token});
                    label = amount = color = size = null;
                    return;
            }

            switch (token) {
                case "aqua": case "black": case "blue": case "fuchsia": case "gray": case "green": case "lime":  case "maroon": case "navy":
                case "olive": case "orange": case "purple": case "red": case "silver": case "teal": case "white": case "yellow":
                    color = token;
                    return;
            }

            switch (token) {
                case "tiny": case "small": case "big":
                size = token;
                return;
            }
        });

        return instructions.length > 0 ? instructions : null;
    }

    /*
    Render multiple rows of instructions.
    Accepts an array of arrays of instructions.
    */
    function render(instructions) {
        drawing.clearRect(0, 0, canvas.width, canvas.height);
        drawing.fillStyle = "GhostWhite";
        drawing.fillRect(0, 0, canvas.width, canvas.height);

        var rowCount = instructions.length;

        var currentRow = 0;
        instructions.forEach(function(rowInstruction) {
            renderRow(rowInstruction, currentRow, rowCount);
            currentRow++;
        });
    }

    /*
    Render a single row of instructions.
    Accepts an array of instructions.
    */
    function renderRow(rowInstructions, currentRow, rowCount) {
        var columnCount = rowInstructions.length;

        var currentColumn = 0;
        rowInstructions.forEach(function(instruction) {
            renderInstruction(instruction, currentRow, currentColumn, rowCount, columnCount);
            currentColumn++;
        });

    }

    /*
    Calculate the center of a shape (e.g. for circles)
    */
    function calcCenter(currentRow, currentColumn, rowCount, columnCount) {
        var cellWidth = canvas.width / columnCount;
        var cellHeight = canvas.height / rowCount;

        return { 
            x: currentColumn * cellWidth + cellWidth / 2,
            y: currentRow * cellHeight + cellHeight / 2
        }
    }

    function calcRect(currentRow, currentColumn, rowCount, columnCount) {
        var cellWidth = canvas.width / columnCount;
        var cellHeight = canvas.height / rowCount;

        return { 
            x: currentColumn * cellWidth,
            y: currentRow * cellHeight,
            w: cellWidth,
            h: cellHeight
        }
    }

    /*
    Render a single instruction.
    */
    function renderInstruction(instruction, currentRow, currentColumn, rowCount, columnCount) {
        drawing.fillStyle = instruction.color ? instruction.color.trim() : "black";

        switch (instruction.shape) {
            case "square":
                Drawing.fillSquare(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount), Math.min(canvas.width / columnCount / 2, canvas.height / rowCount / 2));
                break;

            case "rectangle":
                Drawing.fillRectangle(drawing, calcRect(currentRow, currentColumn, rowCount, columnCount));
                break;

            case "circle":
                Drawing.fillCircle(drawing, calcCenter(currentRow, currentColumn, rowCount, columnCount), Math.min(canvas.width / columnCount / 2, canvas.height / rowCount / 2));
                break;
        }
    }

    window.onload = function() {
        var input = document.getElementById("input");
        input.onkeypress = function() {
            instructions = parse(input.value);
            render(instructions);
        };
    };
})();