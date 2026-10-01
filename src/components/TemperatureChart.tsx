import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Text as SvgText,
  Circle,
} from 'react-native-svg';
import { Colors, Fonts } from '@/constants/theme';
import { registrosClima } from '@/data/mockData';

export default function TemperatureChart() {
  const [chartWidth, setChartWidth] = useState(480);
  const chartHeight = 110;
  const paddingBottom = 24;
  const paddingTop = 12;
  const paddingX = 28;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) setChartWidth(width);
  };

  const data = registrosClima;
  const minTemp = 10;
  const maxTemp = 35;

  const getX = (index: number) => {
    const step = (chartWidth - paddingX * 2) / (data.length - 1);
    return paddingX + index * step;
  };

  const getY = (val: number) => {
    const h = chartHeight - paddingTop - paddingBottom;
    const norm = (val - minTemp) / (maxTemp - minTemp);
    return chartHeight - paddingBottom - norm * h;
  };

  // Build curved path for max temp
  const maxPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.tempMax) }));
  const minPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.tempMin) }));

  const buildSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const maxCurve = buildSmoothPath(maxPoints);
  const minCurve = buildSmoothPath(minPoints);

  // Close area path for gradient
  const areaPath = `${maxCurve} L ${maxPoints[maxPoints.length - 1].x} ${
    chartHeight - paddingBottom
  } L ${maxPoints[0].x} ${chartHeight - paddingBottom} Z`;

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#1B5E40" stopOpacity={0.25} />
            <Stop offset="100%" stopColor="#1B5E40" stopOpacity={0.0} />
          </LinearGradient>
        </Defs>

        {/* Horizontal grid lines */}
        {[16, 24, 32].map((temp) => {
          const y = getY(temp);
          return (
            <React.Fragment key={temp}>
              <Line
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="#D6E4DC"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={8}
                y={y + 3}
                fill="#607A6B"
                fontSize={9}
                fontFamily={Fonts?.mono || 'monospace'}
              >
                {temp}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Shaded Area for Max Temp */}
        <Path d={areaPath} fill="url(#tempGradient)" />

        {/* Max Temp Line */}
        <Path d={maxCurve} fill="none" stroke="#1B5E40" strokeWidth={2.2} />

        {/* Min Temp Dashed Line */}
        <Path
          d={minCurve}
          fill="none"
          stroke="#3A9B6C"
          strokeWidth={1.6}
          strokeDasharray="4 3"
        />

        {/* Data points & X Axis labels */}
        {data.map((d, i) => {
          const x = getX(i);
          const yMax = getY(d.tempMax);
          const isToday = i === data.length - 1;

          return (
            <React.Fragment key={d.fecha}>
              {/* Highlight today dot */}
              {isToday && (
                <Circle
                  cx={x}
                  cy={yMax}
                  r={4}
                  fill="#1B5E40"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              )}

              {/* Date label */}
              <SvgText
                x={x}
                y={chartHeight - 4}
                textAnchor="middle"
                fill="#607A6B"
                fontSize={9}
                fontWeight={isToday ? '700' : '500'}
                fontFamily={Fonts?.mono || 'monospace'}
              >
                {d.fecha}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 110,
    marginTop: 6,
  },
});
