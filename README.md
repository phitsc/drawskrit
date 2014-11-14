## Drawscript
_drawing for text-afficionados_

Drawskrit is a description language for simple drawings and diagrams.


### Basic principles:

* a Drawskrit drawing is grid-based
* every line of text specifies a row of the grid
* every shape specifies a column of the grid
* each cell can only contain a single shape (but see layers)
* everything before a shape describes the shape (but see meta instructions and text peculiarities)
* shapes resize depending on the total number of rows / columns (but see layers)
* all description is case-insensitive
* lines are stripped, i.e. leading and trailing whitespace is removed before the line is processed

### Some basic examples:

A single empty circle filling the whole drawing:

```
circle
```

A red circle:

```
red circle
```

A filled red circle:

```
filled red circle
```

Four colored squares:

```
filled red square filled green square
filled blue square filled yellow square
```


### Shapes

Shapes are the main drawing instructions. Some of the shapes can be specified not only by their name, but also by an equivalent "symbol" (which can be made up by one or more symbols).

The supported shapes are:

Shape       | Symbol
:----------:|:------:
`circle`    | `o`
`square`    | `#`
`rectangle` | `[]`
`ellipse`   | `()`
`triangle`  | `/\`
`line`      | `-`
`blank`     | `_`

The purpose of `blank` is to add invisible shapes to the grid in order to resize and position the other shapes as required.


### Shape cardinality

A natural number specified before a shape multiplies that shape the respective number of times.

Draw four red circles:

```
4 red circles
```

Notice that all shapes can also be specified in their plural form.


### Shape properties

Shapes can be specified with various properties in order to change their color, size, filling and line style.

#### Color

Valid color specifiers are:

* aqua, black, blue, fuchsia, gray, green, lime, maroon, navy, olive, orange, purple, red, silver, teal, white, and yellow.

#### Size

Valid size specifiers are:

Size | % if cell width / height
:---:|:------:
tiny | 25%
small | 50%
big   | 85%
huge | 100%

In case no size is specified shapes are drawn with 75% of a cells width / height.



The order in which shape properties are specified is irrelevant. In case two competing properties are specified for the same shape, the last one (i.e. the one closest to the shape) wins.

### Text


### Comments

Lines starting with `;` (semicolon) are considered to be comments and are ignored.


### Meta instructions

There are two special instructions that have an effect on all shapes that are specified after them:

#### Background

The `background` meta instruction defines the background color of all the rows following its specification.

2 circles above 3 squares on green background:

```
green background
2 circles
3 squares
```

2 circles on green background above 3 squares on lime background:

```
green background 2 circles
lime background 3 squares
```

#### Shapes

The `shapes` meta instruction allows to change the default properties of all the shapes following its specification:

Draw a big purple filled circle, a big red filled square and a big green filled triangle:

```
big purple filled circle big red filled square big green filled triangle
```

Draw a big purple filled circle, a big red filled square and a big green filled triangle:

```
big filled shapes
purple circle red square green triangle
```

### Layers
