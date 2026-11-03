# Architecture

## Drawing

All drawings are represented as 'Strokes'.

```
interface Stroke
{
    color: string           // anything CSS/Canvas2D can handle (eg. 'red', '#ff0000', 'rgb(255,0,0)') or 'erase'
    outline: MultiPolygon   // the shape(s) of the stroke.
    topLeft: PolyPoint      // the top left corner of the bounding rectangle of the stroke
    bottomRight: PolyPoint  // the bottom right corner of the bounding rectangle of the stroke
}
```

### Geometry Types

Geometry types used for drawing strokes:
* `PolyPoint: [number, number]` - array of two numbers, x and y.
* `Ring: PolyPoint[]` - A connected line of points. Implicitely closed (the last point is connected to the first). If the points are in clockwise order then the inside is filled, if they are in counter-clockwise order then they define a 'hole' in another ring.
* `Polygon: Ring[]` - A single, connected, shape. Should have exactly 1 clockwise ring in first position, and optional 'hole' rings in the other locations.
* `MultiPolygon: Polygon[]` - A list of Polygons.

## Wet vs. Dry ink

Most of the strokes are 'dry' ink. That means the user us done painting this specific stroke and it will no longer changed (until erasing happens). These are stored in `session.strokes`.

Every use has at most one 'wet' or 'active' stroke which they are currently drawing. These are stored in `session.myActiveStroke`. The active stroke is mirrored to other players using the `session.activeStrokes` object at a slower rate to avoid overloading the network.

## API

### Reading the current state (for rendering, etc ...)

The current state is available in the 'session' store. It should be treated read-only, but is fully reactive for Vue components:
* `session.strokes : Mapish<string,Stroke>` - currently visible strokes. The keys are unique but have no meaning. Automatically synced over network.
* `session.activeStrokes : Mapish<string,Stroke>` - currently active strokes. The keys are the userIds of the users drawing the current stroke (used to filter your own stroke and also to draw user color aura). Automatically synced over network at throttled rate.
* `session.myActiveStroke: Stroke`- your currently active stroke. Not sent over the network.

### Modifying the state (adding new strokes, erasing things)

```
import * as Strokes from '@/strokes'

type TouchPoint = [
    number,         // X coordinate (relative to drawing stage)
    number,         // Y coordinate
    number          // pressure [0..1]. Take from PointerEvent
]

// Begin a new stroke. If an active stroke exists, it is finalized.
function beginStroke(
    start: TouchPoint,      // first point in stroke
    color: string,          // color of stroke. use Strokes.ERASE to create a stroke which erases things.
    size: number,           // diameter of the brush
    isPen: boolean          // if false then pressure is simulated, otherwise the pressure in the touch points are used
) : void;


// add a new point to the currently active stroke. If no stroke is active, this does nothing.
function continueStroke(
    pos: TouchPoint,        // point to add
) : void;


// set the stroke to be exactly the given list of points. This can be used to
// draw predefined shapes like rectangles with a live preview. Note that if you
// want a closed shape you need to duplicate the first point at the end (so a
// rectangle has 5 points for example [A, B, C, D, A])
function setActiveStrokeShape(
    points: TouchPoint[]    // list of points to set
) : void;

/ finalize the active stroke. If this is a painting stroke, it is moved to the
// 'dry' strokes. If this is an erasing stroke, the outline is subtracted from
// all other 'dry' strokes. If there is no active stroke, this does nothing.
// After this function returns, the active stroke is cleared and there is no longer an active stroke.
function endStroke(
    pos?: TouchPoint            // optional final point to add to the stroke before finalizing it
) : void;
```
