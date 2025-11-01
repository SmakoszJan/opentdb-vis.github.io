import {useEffect, useState} from 'react'
import './App.css'
import {Bar, BarChart, Tooltip, XAxis, YAxis} from "recharts";

// class Category {
//     id: number;
//     name: string;
// }

type Category = {
    id: number,
    name: string,
    color: string
}

type DataPoint = {
    data: { [category: string]: number },
    difficulty: string
}

function rank(v: string) {
    switch (v) {
        case "easy":
            return 0;
        case "medium":
            return 1;
        case "hard":
            return 2;
        default:
            return 3;
    }
}

function App() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [data, setData] = useState<DataPoint[]>([]);
    const [filter, setFilter] = useState('all');
    const [maxCount, setMaxCount] = useState(0);

    useEffect(() => {
        fetch("https://opentdb.com/api_category.php").then(res => res.json()).then(res => {
            let i = 0;
            let max = res["trivia_categories"].length;
            res["trivia_categories"].sort((a: { name: string; }, b: { name: string; }) => a.name.localeCompare(b.name));
            setCategories(res["trivia_categories"].map((category: { id: string; name: string; }) => {
                return {
                    id: category.id,
                    name: category.name,
                    color: `hsl(${720 * i++ / max}, 100%, ${40 + 10 * (i % 3)}%)`
                };
            }));
        });
    }, []);

    let retry = 0;
    useEffect(() => {
        fetch("https://opentdb.com/api.php?amount=50").then(res => res.json()).then((res) => {
            if (res["response_code"] == 0) {
                let newData: { [difficulty: string]: { [category: string]: number } } = {};
                res["results"].forEach((res: { difficulty: string, category: string }) => {
                    if (!(res.difficulty in newData)) newData[res.difficulty] = {};
                    let category = res.category.replace('&amp;', '&');
                    if (!(category in newData[res.difficulty])) newData[res.difficulty][category] = 0;
                    newData[res.difficulty][category]++;
                });
                let points: DataPoint[] = [];
                let maxCount = 0;
                for (let [difficulty, map] of Object.entries(newData)) {
                    let sum = 0;
                    for (let [_, count] of Object.entries(map)) sum += count;
                    if (sum > maxCount) maxCount = sum;

                    points.push({difficulty, data: map});
                }
                points.sort((a, b) => rank(a.difficulty) - rank(b.difficulty));
                setData(points);
                setMaxCount(maxCount);
            } else {
                setTimeout(() => {
                    retry++;
                }, 5000);
            }
        });
    }, [retry]);

    let trueData = [];
    if (filter === "all") {
        trueData = data;
    } else {
        for (let point of data) {
            let cats: { [category: string]: number } = {};
            if (filter in point.data) {
                cats[filter] = point.data[filter];
            }
            trueData.push({
                difficulty: point.difficulty,
                data: cats
            });
        }
    }

    return (
        <>
            <h1><b>OpenTDB Visualizer</b> - a simple tool for visualising data from {' '}
                <a href="https://opentdb.com">OpenTDB</a>.</h1>
            <main>
                <div id="chart">
                    <BarChart
                        style={{width: '500px', maxHeight: '70vh', aspectRatio: 1}}
                        responsive data={trueData}>
                        <XAxis dataKey="difficulty"/>
                        <YAxis domain={[0, maxCount]} width="auto" type="number" scale="linear"/>
                        <Tooltip contentStyle={{
                            backgroundColor: '#0c0e14',
                            border: '1px solid #89ddff',
                            borderRadius: '0.5em',
                        }} labelStyle={{
                            fontWeight: 'bold',
                            fontSize: '1.3em',
                        }} wrapperStyle={{
                            backgroundColor: '#0c0e14',
                            borderRadius: '0.5em',
                        }} cursor={{fill: "#0c0e14"}}/>
                        {categories.map(category => <Bar key={category.id} dataKey={point => point.data[category.name]}
                                                         name={category.name}
                                                         fill={category.color}
                                                         stackId="stack"/>)}
                    </BarChart>
                </div>
                <div id="legend">
                    {categories.map(category =>
                        <button key={category.id} style={{
                            backgroundColor: filter === category.name ? category.color : undefined,
                            color: filter === category.name ? '#1a1b26' : 'white',
                            transition: 'all 0.2s',
                        }} onClick={() => {
                            if (filter !== category.name) {
                                setFilter(category.name);
                            } else {
                                setFilter("all");
                            }
                        }}>
                            <div className="square" style={{
                                backgroundColor: category.color,
                            }}/>
                            {category.name}</button>
                    )}
                </div>
            </main>
            <p>Click on a category to only see data from that category.</p>
        </>
    )
}

export default App
