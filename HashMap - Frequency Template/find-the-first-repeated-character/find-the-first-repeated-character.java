class Solution {
    public char firstRepeated(String s) {
        HashMap<Character, Integer> map = new HashMap<>();

        for(int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);

            if(map.containsKey(ch)) {
                return ch;
            }

            map.put(ch, 1);
        }

        return '-';
    }
}