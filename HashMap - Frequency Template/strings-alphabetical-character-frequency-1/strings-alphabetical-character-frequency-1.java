import java.util.TreeMap;

class Solution {
    public void countFrequencySorted(String s) {
        TreeMap<Character, Integer> map = new TreeMap<>();

        for(int i=0;i<s.length();i++){
            char ch = s.charAt(i);
            if(map.containsKey(ch)){
                map.put(ch, map.get(ch));
            }else{
                map.put(ch,1);
            }
        }
        for(char ch : map.keySet()){
            System.out.print(ch+""+map.get(ch));
        }
    }
}