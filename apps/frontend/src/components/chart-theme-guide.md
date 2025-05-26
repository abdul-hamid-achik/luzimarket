# Chart Theme Guide - Luzi Market

This guide outlines the styling standards for all chart components to maintain consistency with the site's design system.

## Color Palette

### Primary Colors
- **Black (#000000)**: Primary brand color, used for main data series and text
- **Red (#FF4236)**: Accent color from site, used for highlights and secondary data
- **Dark Gray (#666666)**: Tertiary color for additional data series
- **Medium Gray (#999999)**: Quaternary color for subtle elements
- **Light Gray (#cccccc)**: Quinary color for backgrounds and borders

### Background & Borders
- **White (#ffffff)**: Chart backgrounds
- **Light Gray (#e0e0e0)**: Grid lines
- **Black (#000000)**: Container borders

## Typography

### Font Family
- **Primary**: 'UniLTStd-L' (site's primary font)
- **Fallback**: system fonts

### Font Sizes
- **Chart Title**: 18px (16px on mobile)
- **Legend**: 12px
- **Axis Labels**: 11px
- **Tooltip**: 12px

## Layout & Spacing

### Container Styling
```css
.chart-container {
    background: #fff;
    border: 1px solid #000;
    border-radius: 15px;
    padding: 2rem (1rem on mobile);
    font-family: 'UniLTStd-L';
}
```

### Margins
- Chart margins: `{ top: 20, right: 30, left: 20, bottom: 20 }`
- Container gap: 1rem between charts

## Component Guidelines

### Tooltips
- White background with black border
- Border radius: 8px
- Font family: 'UniLTStd-L'
- Include proper data formatting (currency, percentages, etc.)

### Grid Lines
- Stroke: #e0e0e0
- Stroke width: 0.5px
- Dash array: "3 3"

### Axis Styling
- No axis lines (`axisLine={false}`)
- No tick lines (`tickLine={false}`)
- Black text color (#000)

### Interactive Elements
- Active dots: Red (#FF4236) for emphasis
- Hover effects: Maintain brand colors
- Line stroke width: 2-3px for visibility

## Implementation

1. Import the CSS file: `import "@/css/graficos_prueba.css"`
2. Wrap charts in `.chart-container` div
3. Add `.chart-title` for consistent title styling
4. Use the defined color palette variables
5. Implement custom tooltips with `.chart-tooltip` class

## Responsive Design

- Mobile breakpoint: 768px
- Flex direction changes to column on mobile
- Reduced padding and font sizes
- Maintain readability and interaction 