import java.io.*;
import java.util.*;

class Solution {
	// Write the function here...
	public int Missing(int[] arr) {
		int ans=0;
		for(int i=1;i<=arr.length+1;i++){
			if(arr[i]!=i){
				ans = arr[i]-1
			}
		}
		return ans;
	}
}

// Driver code starts here... DO NOT CHANGE THIS
class Main {
	public static void main(String args[]) throws IOException {
		BufferedReader read = new BufferedReader(new InputStreamReader(System.in));
		int t = Integer.parseInt(read.readLine());
		while (t-- > 0) {
			int n = Integer.parseInt(read.readLine().trim());
			int[] arr = new int[n];
			
			String[] input = read.readLine().trim().split(" ");
			

			for (int i = 0; i < n; i++) {
				arr[i] = Integer.parseInt(input[i]);
			}

			Solution ob = new Solution();
			int result = ob.Missing(arr);
			System.out.println(result);
			System.out.println("~");
		}
	}
}
