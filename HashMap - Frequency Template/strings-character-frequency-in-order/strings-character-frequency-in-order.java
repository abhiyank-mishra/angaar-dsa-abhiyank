import java.util.LinkedHashMap;

class Solution {
    public void countFrequency(String s) {
        HashMap<Character, Integer> map = new HashMap<>();
        for(int i=0;i<s.length();i++){
            if(map.containKey(ch)){
                map.put(ch, map.get(ch)+1);
            }else{
                map.put(ch,1);
            }
            System.out.print(map.get(ch));
        }
    }
}