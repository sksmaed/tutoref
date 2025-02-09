export const FILTER_TYPE_MAP: Record<string, string> = {
    semester: '期數',
    category: '課程類別',
    grade: '適用上課年級',
    duration: '課程時長'
};

export const DURATION_MAP: Record<number, string> = {
    90: '大堂課（90分鐘）',
    40: '小堂課（40分鐘）',
};

export const DURATION_INVERSE_MAP: Record<string, number> = {
    '大堂課（90分鐘）': 90,
    '小堂課（40分鐘）': 40,
};

export const SEMESTER_MAP: Record<string, string> = {
    '111-一': '23冬',
    '111-二': '23夏',
    '112-一': '24冬',
    '112-二': '24夏',
    '113-一': '25冬',
    '113-二': '25夏',
};