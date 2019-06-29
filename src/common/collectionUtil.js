/**
 * @description collection util
 * @author yq
 * @date 2019-06-29 13:14
 */

class CollectionUtil {
    static binarySearch(sortedArray, item) {
        let lowIdx = 0;
        let highIdx = sortedArray.length - 1;
        while (lowIdx <= highIdx) {
            const midIdx = Math.floor((lowIdx + highIdx) / 2);
            if (sortedArray[midIdx] === item) {
                return midIdx;
            }
            else if (sortedArray[midIdx] < item) {
                lowIdx = midIdx + 1;
            }
            else {
                highIdx = midIdx - 1;
            }
        }
        return null;
    }
}

module.exports = CollectionUtil;
