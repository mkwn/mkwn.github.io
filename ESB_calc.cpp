#include <iostream>
#include <vector>
#include <algorithm>
#include <set>
#include <chrono>
using namespace std;

struct polynomial {
    // A multilinear polynomial of degree at most 2, 
    // with coefficients in {0, 1} and no constant term.
    int n; 
    vector<int> linear; 
    vector<vector<int>> quadratic; 
    
    polynomial(int n) : n(n) {
        linear.assign(n, 0);
        quadratic.assign(n, vector<int>(n, 0));
    }

    bool operator <(const polynomial& other) const {
        if (n != other.n) return n < other.n;
        if (linear != other.linear) return linear < other.linear;
        return quadratic < other.quadratic;
    }

    // The function 'canonically_label_slow' below permutes variables of the polynomial in a 'canonical' way:
    // that is, if two polynomials can be obtained from each other by a permutation
    // of variables, then their canonical labellings should coincide.
    // This avoids storing multiple copies of equivalent polynomials.

    // This is a slow version of this function, which checks all n! permutations.
    void canonically_label_slow(){
        vector <int> current(n), best(n); 
        for (int i = 0; i < n; i++) current[i] = best[i] = i;

        while (1){
            int result = 0;
            for (int i = 0; i < n && result == 0; i++){
                if (linear[current[i]] < linear[best[i]]){
                    result = 1;
                }
                else if (linear[current[i]] > linear[best[i]]){
                    result = -1;
                }
            }
            for (int i = 0; i < n && result == 0; i++){
                for (int j = i+1; j < n && result == 0; j++){
                    if (quadratic[current[i]][current[j]] < quadratic[best[i]][best[j]]){
                        result = 1;
                    }
                    else if (quadratic[current[i]][current[j]] > quadratic[best[i]][best[j]]){
                        result = -1;
                    }
                }
            }
            if (result == 1) {
                best = current;
            }

            if (!next_permutation(current.begin(), current.end())) break;
        }

        vector <int> new_linear(n);
        vector <vector<int>> new_quadratic(n, vector<int>(n, 0));
        for (int i = 0; i < n; i++){
            new_linear[i] = linear[best[i]];
            for (int j = 0; j < n; j++){
                new_quadratic[i][j] = quadratic[best[i]][best[j]];
            }
        }
        linear = new_linear;
        quadratic = new_quadratic;
    }

    // The function 'canonically_label_faster' below uses heuristics to find
    // a canonical labelling faster in practice. Namely, it first sorts the variables
    // by their linear coefficients and 'degrees' with respect to the quadratic part,
    // and then checks only permutations preserving these two parameters.

    // This is a helper function to recursively generate permutations that 
    // preserve groups of variables with the same linear coefficients and 'degree'.
    void list_permutations(vector <int> & permutation, 
        int index, int s_prev,
        vector <int> & group_sizes, 
        vector <vector<int>> & permutation_list){
        if (index == group_sizes.size()){
            permutation_list.push_back(permutation);
            return;
        }

        int s = group_sizes[index];
        if (s == 0){
            list_permutations(permutation, index + 1, s_prev, group_sizes, permutation_list);
            return;
        }

        for (int i = s_prev; i < s_prev + s; i++) permutation[i] = i;
        while (1){
            list_permutations(permutation, index + 1, s_prev + s, group_sizes, permutation_list);

            if (!next_permutation(permutation.begin() + s_prev, permutation.begin() + s_prev + s)) 
                break;
        }
    }
    void canonically_label_faster() {
        vector<int> weight(n); // Weight of a variable: n * linear coefficient + 'degree' in quadratic part
        vector <vector <int>> groups(2*n); // groups[k] -- list of variables with weight k
        for (int i = 0; i < n; i++) {
            weight[i] = n * linear[i];
            for (int j = 0; j < n; j++) {
                weight[i] += quadratic[i][j];
            }
            groups[weight[i]].push_back(i);
        }
        vector <int> group_sizes(2*n);
        vector <int> order_by_weight; // Variables sorted by non-decreasing weight
        for (int w = 0; w < 2*n; w++){
            group_sizes[w] = groups[w].size();
            for (int index : groups[w]) {
                order_by_weight.push_back(index);
            }            
        }

        // Generating the list of permutations preserving each of the blocks
        // [0, group_sizes[0]-1], [group_sizes[0], group_sizes[0]+group_sizes[1]-1], etc.
        vector <int> current_permutation(n);
        vector <vector<int>> preserving_permutations;
        list_permutations(current_permutation, 0, 0, group_sizes, preserving_permutations);

        vector <int> current(n), best(n);
        best = order_by_weight;
        
        // Composing each of 'preserving_permutations' with 'order_by_weight', 
        // we obtain all permutations of the original variables that preserve weights.
        // We check each of them to find the one that gives the lexicographically
        // smallest quadratic part.
        for (auto & permutation : preserving_permutations){
            for (int i = 0; i < n; i++){
                current[i] = order_by_weight[permutation[i]];
            }
            int result = 0;
            for (int i = 0; i < n && result == 0; i++){
                for (int j = i+1; j < n && result == 0; j++){
                    if (quadratic[current[i]][current[j]] < quadratic[best[i]][best[j]]){
                        result = 1;
                    }
                    else if (quadratic[current[i]][current[j]] > quadratic[best[i]][best[j]]){
                        result = -1;
                    }
                }
            }
            if (result == 1) {
                best = current;
            }
        }

        // Applying the permutation we found to our polynomial.
        vector<int> new_linear(n);
        vector<vector<int>> new_quadratic(n, vector<int>(n));
        for (int i = 0; i < n; i++) {
            new_linear[i] = linear[best[i]];
            for (int j = 0; j < n; j++) {
                new_quadratic[i][j] = quadratic[best[i]][best[j]];
            }
        }
        linear = new_linear;
        quadratic = new_quadratic;
    }

    // A polynomial lies in G(m) if it satisfies the following two conditions:
    // (1) For each variable x_i, substituting x_i = 1 creates 
    //     a constant term or a coefficient not in {0, 1};
    // (2) For each variable x_i, substituting x_i = 1 results
    //     in a polynomial with at most m-1 nonzero linear terms.
    bool check_condition1(){
        for (int i = 0; i < n; i++){
            if (linear[i] == 1) continue;
            bool ok = false;
            for (int j = 0; j < n && !ok; j++){
                if (i != j && linear[j] + quadratic[i][j] >= 2) {
                    ok = true;
                }
            }
            if (!ok) return false;
        }
        return true;
    }
    bool check_condition2(int m){
        for (int i = 0; i < n; i++){
            int count = 0;
            for (int j = 0; j < n; j++){
                if (i != j && (linear[j] + quadratic[i][j]) != 0) count++;
            }
            if (count >= m) return false;
        }
        return true;
    }

    // For a real number p in [0, 1], this function computes the maximum       
    // over all â„“ >= min_ell of the probability that the value of the polynomial 
    // at independent Ber(p) random variables is equal to â„“.
    long double max_concentration_probability(long double p, int min_ell){
        vector <long double> probabilities(n*n + n + 1);
        for (int mask = 0; mask < (1<<n); mask++){
            long double prob = 1;
            for (int i = 0; i < n; i++){
                prob *= (mask>>i&1) ? p : (1-p);
            }
            int value = 0;
            for (int i = 0; i < n; i++){
                if (mask>>i&1) value += linear[i];
                else continue;
                for (int j = i+1; j < n; j++){
                    if (mask>>j&1) value += quadratic[i][j];
                }
            }
            probabilities[value] += prob;
        }   
        long double max_probability = 0;
        for (int ell = min_ell; ell < probabilities.size(); ell++) {
            max_probability = max(max_probability, probabilities[ell]);
        }
        return max_probability;
    }
};

// Given the list of polynomials in n-1 variables satisfying condition (2),
// this function generates polynomials in n variables satisfying condition (2).
vector <polynomial> generate_condition2 (int n, int m, vector <polynomial> & previous){
    set <polynomial> result;
    for (polynomial & prev_poly : previous){
        polynomial poly_base(n);
        int sum_linear = 0;
        for (int i = 0; i < n-1; i++){
            poly_base.linear[i] = prev_poly.linear[i];
            sum_linear += poly_base.linear[i];
            for (int j = 0; j < n-1; j++){
                poly_base.quadratic[i][j] = prev_poly.quadratic[i][j];
            }
        }

        // We iterate over all possible ways to add a new variable to the polynomial
        // (each of linear[n-1], quadratic[0][n-1], ... quadratic[n-2][n-1] can be 0 or 1).
        for (int linear_coef = 0; linear_coef <= 1; linear_coef++){            
            // We may assume that the variables with linear coefficients equal to 0
            // go before variables with linear coefficients equal to 1.
            if (linear_coef == 0 && sum_linear != 0) continue;

            for (int mask = 0; mask < (1<<(n-1)); mask++){
                // If the last variable appears in >= m quadratic terms,
                // then condition (2) is definitely violated.
                if (__builtin_popcount(mask) >= m) continue;

                polynomial poly = poly_base;
                poly.linear[n-1] = linear_coef;
                for (int j = 0; j < n-1; j++){
                    if (mask>>j&1) poly.quadratic[n-1][j] = poly.quadratic[j][n-1] = 1;
                }
                // If the polynomial we obtained satisfies condition (2), then
                // we replace it with its canonical form and insert it into the 'result' set
                // (since it's a set, duplicates are automatically ignored).
                if (poly.check_condition2(m)){
                    poly.canonically_label_faster();
                    result.insert(poly);
                }
            }
        }
    }
    return vector<polynomial>(result.begin(), result.end());
}

// Using that each element of G(m) is a polynomial in at most (m+1)^2/4 variables,
// this function generates all the polynomials in G(m) 
// (that is, those satisfying conditions (1) and (2))
vector <polynomial> generate_Gm(int m){
    int N = (m+1)*(m+1)/4;
    vector <polynomial> result, current, previous;
    previous.push_back(polynomial(0)); // start with the polynomial in 0 variables

    for (int n = 1; n <= N; n++){
        current = generate_condition2(n, m, previous);
        for (polynomial & poly : current){
            if (poly.check_condition1()){
                result.push_back(poly);
            }
        }
        previous = current;
    }
    return result;
}

// This function computes ||Bin(m, p)|| -- maximum concentration probability 
// of the polynomial (x_1 + x_2 + ... + x_m) at independent Ber(p) random variables.
long double norm_bin(int m, long double p){
    polynomial poly(m);
    for (int i = 0; i < m; i++) poly.linear[i] = 1;
    return poly.max_concentration_probability(p, 0);
}

int main(){
    cout.precision(6); cout << fixed;
    auto start_time = chrono::high_resolution_clock::now();

    const long double p = 1.0/3;
    const int m = 5;
    // This code works instantly for m <= 4 and takes around 20 seconds (on the author's laptop) for m = 5.

    cout << "Value of m: " << m << endl;
    cout << "Value of p: " << p << endl;

    cout << "||Bin(m, p)||: " << norm_bin(m, p) << endl;

    cout << "Generating G(" << m << ")..." << endl;    

    vector <polynomial> Gm = generate_Gm(m);
    cout << "Generated " << Gm.size() << " polynomials in G(" << m << ")." << endl;

    int N = (m+1)*(m+1)/4;
    vector <long double> max_prob(N+1);
    vector <int> number(N+1);
    for (polynomial & poly : Gm){
        long double prob = poly.max_concentration_probability(p, 2);
        max_prob[poly.n] = max(max_prob[poly.n], prob);
        number[poly.n]++;
    }

    long double max_prob_total = 0;
    for (int n = 1; n <= N; n++){
        cout << "Among " << number[n] << " polynomials in " << n << " variables, maximum concentration probability at ell >= 2 is: " << max_prob[n] << endl;
        max_prob_total = max(max_prob_total, max_prob[n]);
    }
    cout << "Maximum concentration probability at ell >= 2 over G(" << m << ") is: " << max_prob_total << endl;

    auto finish_time = chrono::high_resolution_clock::now();
    cout << "Total execution time: " << chrono::duration_cast<chrono::milliseconds>(finish_time - start_time).count() << " ms" << endl;

    return 0;
}
    
