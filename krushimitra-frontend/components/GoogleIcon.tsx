import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';

const googleIconSource: ImageSourcePropType = {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png'
};

export const GoogleIcon = ({ size = 24 }: { size?: number }) => (
    <Image
        source={googleIconSource}
        style={{ width: size, height: size }}
        resizeMode="contain"
    />
);
