class Solution {
    public char findTheDifference(String s, String t) {
        Map<Character, Integer> map = new HashMap<>();
        int sums = 0;
        int sumt = 0;

        for(int i=0;i<s>t? s:t;i++){
            sums += s.charAt(i);
            sumt += t.charAt(i);
        }
       
        
        return (char)(sumt-sumt);
    }
}
