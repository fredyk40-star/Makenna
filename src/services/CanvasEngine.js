/**
 * Canvas Engine - Optimized canvas rendering for tracing and drawing
 */

export class CanvasEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d');
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.strokes = [];
    this.currentStroke = [];
    this.undoStack = [];
    this.redoStack = [];
    this.colors = ['#2563EB', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6'];
    this.currentColor = this.colors[0];
    this.lineWidth = 5;
    this.isEraser = false;
    this.drawingMode = 'free'; // 'free', 'guide', 'trace'
    this.guideData = null;
    this.dpi = 1;
    
    this.setupCanvas();
  }

  /**
   * Setup canvas with proper sizing and DPI
   */
  setupCanvas() {
    if (!this.canvas || !this.ctx) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.dpi = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * this.dpi;
    this.canvas.height = rect.height * this.dpi;
    
    this.ctx.scale(this.dpi, this.dpi);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * Resize canvas
   */
  resize() {
    this.setupCanvas();
    this.redraw();
  }

  /**
   * Start drawing at position
   */
  startDraw(x, y) {
    this.isDrawing = true;
    this.lastX = x;
    this.lastY = y;
    this.currentStroke = [{ x, y }];
    
    if (this.ctx) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
    }
  }

  /**
   * Continue drawing to position
   */
  draw(x, y) {
    if (!this.isDrawing || !this.ctx) return;
    
    this.currentStroke.push({ x, y });
    
    if (this.isEraser) {
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
    }
    
    this.ctx.strokeStyle = this.isEraser ? '#FFFFFF' : this.currentColor;
    this.ctx.lineWidth = this.isEraser ? this.lineWidth * 2 : this.lineWidth;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    
    this.lastX = x;
    this.lastY = y;
  }

  /**
   * End drawing
   */
  endDraw() {
    if (this.isDrawing && this.currentStroke.length > 0) {
      this.strokes.push({
        points: [...this.currentStroke],
        color: this.currentColor,
        lineWidth: this.lineWidth,
        isEraser: this.isEraser
      });
      
      this.undoStack.push(this.strokes.length - 1);
      this.redoStack = [];
    }
    
    this.isDrawing = false;
    this.currentStroke = [];
    
    if (this.ctx) {
      this.ctx.globalCompositeOperation = 'source-over';
    }
  }

  /**
   * Undo last stroke
   */
  undo() {
    if (this.undoStack.length === 0) return false;
    
    const index = this.undoStack.pop();
    this.redoStack.push(index);
    this.redraw();
    return true;
  }

  /**
   * Redo last undone stroke
   */
  redo() {
    if (this.redoStack.length === 0) return false;
    
    const index = this.redoStack.pop();
    this.undoStack.push(index);
    this.redraw();
    return true;
  }

  /**
   * Clear canvas
   */
  clear() {
    this.strokes = [];
    this.currentStroke = [];
    this.undoStack = [];
    this.redoStack = [];
    this.redraw();
  }

  /**
   * Redraw all strokes
   */
  redraw() {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set background if needed
    if (this.guideData) {
      this.drawGuide();
    }
    
    // Draw all strokes
    for (const stroke of this.strokes) {
      this.drawStroke(stroke);
    }
  }

  /**
   * Draw a single stroke
   */
  drawStroke(stroke) {
    if (!this.ctx || stroke.points.length < 2) return;
    
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    for (let i = 1; i < stroke.points.length; i++) {
      this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    
    this.ctx.strokeStyle = stroke.isEraser ? '#FFFFFF' : stroke.color || this.currentColor;
    this.ctx.lineWidth = stroke.isEraser ? stroke.lineWidth * 2 : stroke.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.globalCompositeOperation = stroke.isEraser ? 'destination-out' : 'source-over';
    
    this.ctx.stroke();
    this.ctx.restore();
    this.ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Draw guide lines for tracing
   */
  drawGuide() {
    if (!this.ctx || !this.guideData) return;
    
    this.ctx.save();
    this.ctx.globalAlpha = 0.3;
    this.ctx.strokeStyle = '#94A3B8';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    // Draw guide path from guideData
    if (this.guideData.strokes) {
      for (const stroke of this.guideData.strokes) {
        if (stroke.points && stroke.points.length > 1) {
          this.ctx.beginPath();
          this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          this.ctx.stroke();
        }
      }
    }
    
    this.ctx.restore();
    this.ctx.setLineDash([]);
  }

  /**
   * Set guide data for tracing
   */
  setGuide(guideData) {
    this.guideData = guideData;
    this.redraw();
  }

  /**
   * Set drawing color
   */
  setColor(color) {
    this.currentColor = color;
    this.isEraser = false;
  }

  /**
   * Set line width
   */
  setLineWidth(width) {
    this.lineWidth = width;
  }

  /**
   * Toggle eraser mode
   */
  toggleEraser() {
    this.isEraser = !this.isEraser;
  }

  /**
   * Set drawing mode
   */
  changeMode(mode) {
    this.drawingMode = mode;
  }

  /**
   * Get canvas data URL
   */
  getDataURL() {
    return this.canvas ? this.canvas.toDataURL() : null;
  }

  /**
   * Load image data
   */
  loadDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0);
      }
    };
    img.src = dataURL;
  }

  /**
   * Export drawing
   */
  exportDrawing() {
    return {
      strokes: this.strokes,
      colors: this.colors,
      lineWidth: this.lineWidth
    };
  }

  /**
   * Import drawing
   */
  importDrawing(data) {
    this.strokes = data.strokes || [];
    this.colors = data.colors || this.colors;
    this.lineWidth = data.lineWidth || this.lineWidth;
    this.redraw();
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.strokes = [];
    this.currentStroke = [];
    this.undoStack = [];
    this.redoStack = [];
    this.canvas = null;
    this.ctx = null;
  }
}