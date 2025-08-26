import React, { useState } from 'react'

function Createquiz() {
    const [startquiz, setStartquiz] = useState(false);
  return (
    <div className="">
        
        <button className=' m-8 bg-amber-200' onClick={()=>setStartquiz(true)}>Create Quiz</button>
        {startquiz && (
            <div className="bg-gray-100 p-4 rounded shadow-md">
                <h2 className="text-lg font-bold mb-2">Create a New Quiz</h2>
                <form>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Quiz Title:</label>
                        <input type="text" className="w-full p-2 border rounded" placeholder="Enter quiz title" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Description:</label>
                        <textarea className="w-full p-2 border rounded" placeholder="Enter quiz description"></textarea>
                    </div>
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Create Quiz</button>
                </form>
            </div>
        )}
    </div>
  )
}

export default Createquiz