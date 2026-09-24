import java.io.*;
import java.util.*;

class Solution {
	// Write the function here...
	public int MountainPeak(int[] arr) {
	int l=0;
	int r=arr.length;
	int max = Arrays.stream(arr).max().getAsInt();

	while(l<r){
		int mid = l + (r-l)/2;
		if(arr[mid]==max){
			return mid;
		}
		else if(arr[mid]>max){
			l++;
		}
		else{
			r--;
		}
	}
	return max;
		
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
			int result = ob.MountainPeak(arr);
			System.out.println(result);
			System.out.println("~");
		}
	}
}
