#include<iostream>
#include<vector>
#include<algorithm>
using namespace std; 
int main()
{
   int test; 
   cin >> test ; 
   while(test--)
   {
      int n; 
      cin >> n ; 
      vector <int> scores ; 
        for(int i = 0 ; i <  n ; i++)
        {
            int x; 
            cin >> x;  
            scores.push_back(x);
        }
        sort(scores.begin(), scores.end());
        int count1 = 0 , count2 = 0 ; 
        for(int i = 0 ; i < n ; i++)
    {
        if(count1>=count2)
        {
            count2= count2+scores[i];
        }
        else
        {
            count1 = count1 + scores[i];
        }
    }
    cout << count1 << " " << count2 << endl ;

   }
}