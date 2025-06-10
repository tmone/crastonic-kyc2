import React from 'react';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
// Make the gradient large enough to cover the entire screen
const size = Math.max(width, height) * 1.5;

export function BackgroundGradient() {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -size / 2,
        marginLeft: -size / 2,
      }}
    >
      <Defs>
        <RadialGradient
          id="backgroundGradient"
          cx="50%"
          cy="50%"
          r="50%"
        >
          <Stop offset="0" stopColor="#5383FF" stopOpacity="0.38" />
          <Stop offset="0.885417" stopColor="#3988FF" stopOpacity="0" />
          <Stop offset="0.9999" stopColor="#3988FF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2}
        fill="url(#backgroundGradient)"
        opacity="0.8"
      />
    </Svg>
  );
}