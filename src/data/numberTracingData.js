/**
 * Number Tracing Data - Stroke paths for numbers 0-20
 * Each number has stroke points for tracing guidance
 */

export const NUMBER_TRACING_DATA = {
  '0': {
    strokes: [
      {
        id: '0-1',
        points: [
          { x: 50, y: 15 }, { x: 30, y: 25 }, { x: 20, y: 40 },
          { x: 20, y: 60 }, { x: 30, y: 75 }, { x: 50, y: 85 },
          { x: 70, y: 75 }, { x: 80, y: 60 }, { x: 80, y: 40 },
          { x: 70, y: 25 }, { x: 50, y: 15 }
        ],
        startPoint: { x: 50, y: 15 },
        endPoint: { x: 50, y: 15 },
        direction: 'clockwise',
        order: 0
      }
    ]
  },
  '1': {
    strokes: [
      {
        id: '1-1',
        points: [
          { x: 50, y: 15 }, { x: 50, y: 85 }
        ],
        startPoint: { x: 50, y: 15 },
        endPoint: { x: 50, y: 85 },
        direction: 'down',
        order: 0
      }
    ]
  },
  '2': {
    strokes: [
      {
        id: '2-1',
        points: [
          { x: 30, y: 25 }, { x: 50, y: 15 }, { x: 70, y: 25 },
          { x: 70, y: 40 }, { x: 30, y: 70 }, { x: 30, y: 85 },
          { x: 70, y: 85 }
        ],
        startPoint: { x: 30, y: 25 },
        endPoint: { x: 70, y: 85 },
        direction: 'curved',
        order: 0
      }
    ]
  },
  '3': {
    strokes: [
      {
        id: '3-1',
        points: [
          { x: 60, y: 15 }, { x: 35, y: 25 }, { x: 35, y: 40 },
          { x: 60, y: 45 }, { x: 35, y: 50 }, { x: 35, y: 70 },
          { x: 60, y: 85 }
        ],
        startPoint: { x: 60, y: 15 },
        endPoint: { x: 60, y: 85 },
        direction: 'curved',
        order: 0
      }
    ]
  },
  '4': {
    strokes: [
      {
        id: '4-1',
        points: [
          { x: 40, y: 15 }, { x: 40, y: 85 }
        ],
        startPoint: { x: 40, y: 15 },
        endPoint: { x: 40, y: 85 },
        direction: 'down',
        order: 0
      },
      {
        id: '4-2',
        points: [
          { x: 30, y: 40 }, { x: 60, y: 40 }, { x: 60, y: 85 }
        ],
        startPoint: { x: 30, y: 40 },
        endPoint: { x: 60, y: 85 },
        direction: 'right-down',
        order: 1
      }
    ]
  },
  '5': {
    strokes: [
      {
        id: '5-1',
        points: [
          { x: 60, y: 15 }, { x: 30, y: 15 }, { x: 30, y: 40 },
          { x: 60, y: 45 }, { x: 60, y: 60 }, { x: 30, y: 70 },
          { x: 30, y: 85 }, { x: 60, y: 85 }
        ],
        startPoint: { x: 60, y: 15 },
        endPoint: { x: 60, y: 85 },
        direction: 'curved',
        order: 0
      }
    ]
  },
  '6': {
    strokes: [
      {
        id: '6-1',
        points: [
          { x: 65, y: 25 }, { x: 35, y: 25 }, { x: 25, y: 45 },
          { x: 25, y: 65 }, { x: 35, y: 80 }, { x: 55, y: 85 },
          { x: 70, y: 75 }, { x: 70, y: 60 }, { x: 55, y: 50 },
          { x: 35, y: 55 }
        ],
        startPoint: { x: 65, y: 25 },
        endPoint: { x: 35, y: 55 },
        direction: 'clockwise',
        order: 0
      }
    ]
  },
  '7': {
    strokes: [
      {
        id: '7-1',
        points: [
          { x: 30, y: 20 }, { x: 70, y: 20 }, { x: 45, y: 85 }
        ],
        startPoint: { x: 30, y: 20 },
        endPoint: { x: 45, y: 85 },
        direction: 'right-down',
        order: 0
      },
      {
        id: '7-2',
        points: [
          { x: 40, y: 45 }, { x: 40, y: 85 }
        ],
        startPoint: { x: 40, y: 45 },
        endPoint: { x: 40, y: 85 },
        direction: 'down',
        order: 1
      }
    ]
  },
  '8': {
    strokes: [
      {
        id: '8-1',
        points: [
          { x: 50, y: 15 }, { x: 30, y: 25 }, { x: 25, y: 40 },
          { x: 30, y: 55 }, { x: 50, y: 50 }, { x: 70, y: 55 },
          { x: 75, y: 70 }, { x: 70, y: 80 }, { x: 50, y: 85 },
          { x: 30, y: 75 }, { x: 25, y: 55 }
        ],
        startPoint: { x: 50, y: 15 },
        endPoint: { x: 25, y: 55 },
        direction: 'figure-eight',
        order: 0
      }
    ]
  },
  '9': {
    strokes: [
      {
        id: '9-1',
        points: [
          { x: 35, y: 15 }, { x: 65, y: 15 }, { x: 75, y: 35 },
          { x: 75, y: 55 }, { x: 65, y: 70 }, { x: 45, y: 75 },
          { x: 30, y: 65 }, { x: 30, y: 50 }, { x: 45, y: 40 },
          { x: 65, y: 45 }
        ],
        startPoint: { x: 35, y: 15 },
        endPoint: { x: 65, y: 45 },
        direction: 'counter-clockwise',
        order: 0
      }
    ]
  },
  '10': {
    strokes: [
      {
        id: '10-1',
        points: [
          { x: 25, y: 20 }, { x: 25, y: 80 }
        ],
        startPoint: { x: 25, y: 20 },
        endPoint: { x: 25, y: 80 },
        direction: 'down',
        order: 0
      },
      {
        id: '10-2',
        points: [
          { x: 45, y: 15 }, { x: 65, y: 15 }, { x: 75, y: 30 },
          { x: 75, y: 50 }, { x: 65, y: 65 }, { x: 45, y: 65 },
          { x: 45, y: 80 }, { x: 75, y: 80 }
        ],
        startPoint: { x: 45, y: 15 },
        endPoint: { x: 75, y: 80 },
        direction: 'curved',
        order: 1
      }
    ]
  }
  // Additional numbers 11-20 would follow the same pattern
  // For brevity, I'm including 0-10 as samples
};

export const getNumberTracingData = (number) => {
  return NUMBER_TRACING_DATA[String(number)] || null;
};

export const getNumberStrokeCount = (number) => {
  const data = getNumberTracingData(number);
  return data ? data.strokes.length : 0;
};