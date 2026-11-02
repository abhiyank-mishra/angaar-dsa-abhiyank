class Solution {
    public int subarraysDivByK(int[] nums, int k) {
        int[] c = new int[k];
        c[0] = 1;
        
        int prefixSum = 0;
        int count = 0;
        
        for (int num : nums) {
            prefixSum += num;
            int rem = ((prefixSum % k) + k) % k;
            count += c[rem];
            c[rem]++;
        }
        return count;
    }
}