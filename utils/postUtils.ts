export const isValidDriveLink = (url: string): boolean => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname === 'drive.google.com';
    } catch (error) {
        return false;
    }
};

export const isValidDocLink = (url: string): boolean => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname === 'docs.google.com';
    } catch (error) {
        return false;
    }
};
