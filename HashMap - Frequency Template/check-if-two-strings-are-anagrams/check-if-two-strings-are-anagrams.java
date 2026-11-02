class Solution {
    public boolean areAnagrams(String s1, String s2) {
        int sum=0,sum2=0;
       for(int i=0;i<s.length();i++){
        sum += s1.charAt(i);
        sum2 += s2.charAt(i);
       }
       return sum == sum2;
    }
}