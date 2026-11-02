import java.util.*;

class Solution {
    public int[] intersection(int[] arr1, int[] arr2) {

        HashMap<Integer, Integer> map = new HashMap<>();
        ArrayList<Integer> result = new ArrayList<>();

        for (int x : arr1) {
            map.put(x, 1);
        }

        for (int x : arr2) {
            if (map.containsKey(x)) {
                result.add(x);
                map.remove(x);
            }
        }

        int[] ans = new int[result.size()];

        for (int i = 0; i < result.size(); i++) {
            ans[i] = result.get(i);
        }

        return ans;
    }
}